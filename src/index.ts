import { Environment, StatusError } from "@/types/cloudflare";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { etag } from "hono/etag";
import { StatusCode } from "hono/utils/http-status";
import addBucketRoutes from "@/routes/bucket";
import addSharexRoutes from "@/routes/sharex";

const app = new Hono<Environment>();

app.use("*", etag(), logger());

// Add routes
addSharexRoutes(app);
addBucketRoutes(app);

// Add error handlers
app.notFound(() => {
  throw new StatusError(404);
});

app.onError((err, c) => {
  if (err instanceof StatusError) {
    c.status(<StatusCode>err.status);
  } else {
    c.status(500);
  }

  return c.json({
    error: err.message,
    success: false,
  });
});

// noinspection JSUnusedGlobalSymbols
export default app;
