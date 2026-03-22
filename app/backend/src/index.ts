import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { trpcServer } from "@hono/trpc-server";

import type { Db } from "./db/index.js";
import { createDb } from "./db/index.js";
import { purgeOld } from "./db/queries.js";
import { metricsApp } from "./routes.js";
import { appRouter } from "./trpc.js";

export interface AppEnv {
  Variables: {
    db: Db;
  };
}

const DB_PATH = process.env.DB_PATH ?? "./data/gpu-metrics.db";
const PORT = Number(process.env.PORT ?? 3090);
const PURGE_INTERVAL_MS = 10 * 60 * 1000;

const db = createDb(DB_PATH);

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  c.set("db", db);
  await next();
});

// Agent POST route
app.route("/api", metricsApp);

// tRPC for frontend
app.use(
  "/trpc/*",
  trpcServer({ router: appRouter, createContext: () => ({ db }) }),
);

// Serve frontend static files
app.use("/*", serveStatic({ root: "../frontend/dist" }));

// Purge old metrics every 10 minutes
setInterval(() => {
  purgeOld(db);
}, PURGE_INTERVAL_MS);

console.warn(`GPU Monitor backend listening on port ${String(PORT)}`);
serve({ fetch: app.fetch, port: PORT });
