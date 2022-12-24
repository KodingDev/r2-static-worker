import { Hono } from "hono";
import { Environment, StatusError } from "@/types/cloudflare";
import prettyBytes from "pretty-bytes";
import dayjs from "dayjs";
import { createAWSClient } from "@/util/aws";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const addBucketRoutes = (app: Hono<Environment>) => {
  app.get("*", async (c) => {
    const url = new URL(c.req.url);
    const element = await c.env.BUCKET.get(decodeURI(url.pathname.slice(1)));

    if (!element) {
      throw new StatusError(404);
    }

    // Metadata
    if (c.req.query("meta")) {
      return c.json({
        key: element.key,
        uploaded: element.uploaded.toISOString(),
        etag: element.etag,
        size: element.size,
        httpMetadata: element.httpMetadata,
        customMetadata: element.customMetadata,
      });
    }

    // Discord embed rendering
    if (
      c.req.header("User-Agent")?.includes("Discordbot/2.0") &&
      c.req.query("raw") !== "true"
    ) {
      let snippet: string;

      // Previews
      const extension = element.key.split(".")[1].toLowerCase();
      if (extension === "txt") {
        snippet = (await element.text()).slice(0, 1024);
      } else if (extension.match(/^(jpg|jpeg|png|gif)$/)) {
        snippet = "";
      } else {
        const size = prettyBytes(element.size);
        const date = dayjs(element.uploaded).format("MMM D, YYYY @ h:mm A UTC");
        snippet = `${size} uploaded on ${date}`;
      }

      return c.render("discord", {
        isVideo: extension.match(/^(mp4|webm|mov)$/),
        fileName: element.key.split("/").pop(),
        rawUrl: `${c.req.url}?raw=true`,
        snippet,
      });
    }

    const client = createAWSClient(c.env);
    const command = new GetObjectCommand({
      Key: element.key,
      Bucket: c.env.BUCKET_NAME,
    });

    try {
      const dest = await getSignedUrl(client, command, { expiresIn: 3600 });
      return c.redirect(dest);
    } catch (e) {
      console.error(e);
      throw new StatusError(500);
    }
  });

  app.delete("*", async (c) => {
    const url = new URL(c.req.url);
    await c.env.BUCKET.delete(url.pathname.slice(1));

    return c.json({
      success: true,
    });
  });
};

export default addBucketRoutes;
