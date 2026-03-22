import { Hono } from "hono";

import { insertMetrics } from "./db/queries.js";
import type { AppEnv } from "./index.js";
import { MetricsPayloadSchema } from "./schema.js";

const metricsApp = new Hono<AppEnv>();

metricsApp.post("/metrics", async (c) => {
  const body: unknown = await c.req.json();
  const result = MetricsPayloadSchema.safeParse(body);

  if (!result.success) {
    return c.json({ status: "error", error: result.error.message }, 400);
  }

  const db = c.get("db");
  insertMetrics(db, result.data.gpus, result.data.processes);

  return c.json({ status: "ok" });
});

export { metricsApp };
