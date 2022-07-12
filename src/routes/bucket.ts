import { Hono } from "hono";
import { Environment, StatusError } from "@/types/cloudflare";
import prettyBytes from "pretty-bytes";
import dayjs from "dayjs";

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
        const date = dayjs(element.uploaded).format("MMM D, YYYY @ h:mm A");
        snippet = `${size} uploaded on ${date}`;
      }

      return c.render("discord", {
        fileName: element.key.split("/").pop(),
        rawUrl: `${c.req.url}?raw=true`,
        snippet,
      });
    }

    // Forward the file
    const headers = new Headers();
    element.writeHttpMetadata(headers);
    headers.set("etag", element.httpEtag);

    for (const [key, value] of headers) c.header(key, value);
    return c.body(await element.arrayBuffer());
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
