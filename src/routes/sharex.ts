import { Hono } from "hono";
import { Environment, StatusError } from "@/types/cloudflare";
import { auth } from "@/middleware/auth";

const addSharexRoutes = (app: Hono<Environment>) => {
  app.post("/api/sharex", auth, async (c) => {
    const formData: FormData = await c.req.formData?.();
    const file = formData.get("file") as File;

    if (!file) {
      throw new StatusError(400, "Missing file");
    }

    const date = `${new Date().getFullYear()}-${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;

    await c.env.BUCKET.put(`uploads/${date}/${file.name}`, file.stream());
    return c.json({
      success: true,
      path: `uploads/${date}/${encodeURIComponent(file.name)}`,
    });
  });
};

export default addSharexRoutes;
