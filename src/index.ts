import { Request } from "itty-router";
import { Environment } from "@/types/cloudflare";
import { StatusError, ThrowableRouter } from "itty-router-extras";

const router = ThrowableRouter();

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

router.put("*", async (request: Request, env: Environment) => {
  const url = new URL(request.url);
  const body = await request.blob?.();

  if (!body) {
    throw new StatusError(400, "Bad Request");
  }

  const element = await env.BUCKET.put(url.pathname.slice(1), body);
  if (!element) {
    throw new StatusError(400, "Upload Failed");
  }

  return new Response(
    JSON.stringify({
      success: true,
      element,
    }),
  );
});

router.delete("*", async (request: Request, env: Environment) => {
  const url = new URL(request.url);
  await env.BUCKET.delete(url.pathname.slice(1));

  return new Response(
    JSON.stringify({
      success: true,
    }),
  );
});

router.all("*", () => {
  throw new StatusError(404, "Not Found");
});

// noinspection JSUnusedGlobalSymbols
export default {
  fetch: router.handle,
};
