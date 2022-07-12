import { Request } from "itty-router";
import { Environment } from "@/types/cloudflare";
import { json, StatusError, ThrowableRouter } from "itty-router-extras";

const router = ThrowableRouter();

router.post("/api/upload", async (request: Request, env: Environment) => {
  const formData: FormData = await request.formData?.();
  const file = formData.get("file") as File;

  if (!file) {
    throw new StatusError(400, "Bad Request");
  }

  await env.BUCKET.put(file.name, file.stream());
  return json({
    success: true,
    name: file.name,
  });
});

router.get("*/_meta.json", async (request: Request, env: Environment) => {
  const url = new URL(request.url);
  const path = url.pathname.slice(1, -11);
  const element = await env.BUCKET.get(path);

  if (!element) {
    throw new StatusError(404, "Not Found");
  }

  return json({
    path,
    uploaded: element.uploaded.toISOString(),
    etag: element.etag,
    size: element.size,
  });
});

router.get("*", async (request: Request, env: Environment) => {
  const url = new URL(request.url);
  const element = await env.BUCKET.get(url.pathname.slice(1));

  if (!element) {
    throw new StatusError(404, "Not Found");
  }

  const headers = new Headers();
  element.writeHttpMetadata(headers);
  headers.set("etag", element.httpEtag);

  return new Response(await element.blob(), {
    headers,
  });
});

router.delete("*", async (request: Request, env: Environment) => {
  const url = new URL(request.url);
  await env.BUCKET.delete(url.pathname.slice(1));

  return json({
    success: true,
  });
});

router.all("*", () => {
  throw new StatusError(404, "Not Found");
});

// noinspection JSUnusedGlobalSymbols
export default {
  fetch: router.handle,
};
