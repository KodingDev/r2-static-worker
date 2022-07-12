import { Hono } from "hono";
import { Environment, StatusError } from "@/types/cloudflare";

const addBucketRoutes = (app: Hono<Environment>) => {
  app.get("*/_meta.json", async (c) => {
    const url = new URL(c.req.url);
    const path = url.pathname.slice(1, -11);
    const element = await c.env.BUCKET.get(path);

    if (!element) {
      throw new StatusError(404);
    }

    return c.json({
      path,
      uploaded: element.uploaded.toISOString(),
      etag: element.etag,
      size: element.size,
    });
  });

  app.get("*", async (c) => {
    const url = new URL(c.req.url);
    const element = await c.env.BUCKET.get(url.pathname.slice(1));

    if (!element) {
      throw new StatusError(404);
    }

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
