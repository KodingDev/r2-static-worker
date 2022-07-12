import { Context, Next } from "hono";
import { Environment, StatusError } from "@/types/cloudflare";

export const auth = async (ctx: Context<string, Environment>, next: Next) => {
  const auth = ctx.req.headers.get("authorization");
  if (!auth || auth !== ctx.env.API_KEY) {
    throw new StatusError(401);
  }

  await next();
};
