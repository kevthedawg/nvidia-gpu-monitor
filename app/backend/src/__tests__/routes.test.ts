import { Hono } from "hono";

import { beforeEach, describe, expect, it } from "vitest";

import type { Db } from "../db/index.js";
import { getLatest } from "../db/queries.js";
import { metricsApp } from "../routes.js";
import { atTime, FIXTURES, freshDb } from "./helpers.js";

const { gpu, gpuProcess } = FIXTURES;

const validPayload = {
  gpus: [gpu],
  processes: [gpuProcess],
};

let db: Db;
let post: (body: unknown) => Promise<Response>;

beforeEach(() => {
  db = freshDb();
  const app = new Hono<{ Variables: { db: Db } }>();
  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });
  app.route("/api", metricsApp);

  post = (body: unknown): Promise<Response> =>
    app.request("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
});

describe("POST /api/metrics", () => {
  it("stores valid data and returns 200", async () => {
    const res = await post(validPayload);
    expect(res.status).toBe(200);

    const latest = getLatest(db);
    expect(latest?.gpus).toHaveLength(1);
    expect(latest?.processes).toHaveLength(1);
  });

  it("returns 400 with error status for invalid payload", async () => {
    const res = await post({ gpus: [], processes: [] });
    expect(res.status).toBe(400);

    const json = (await res.json()) as { status: string };
    expect(json.status).toBe("error");
  });

  it("does not store anything on invalid payload", async () => {
    await post({ foo: "bar" });
    expect(getLatest(db)).toBeNull();
  });

  it("latest reflects the most recent POST", async () => {
    await post(validPayload);

    // Insert directly so we control the timestamp without async mock issues
    const { insertMetrics } = await import("../db/queries.js");
    atTime(Date.now() + 10_000, () => {
      insertMetrics(db, [{ ...gpu, gpuUtil: 50 }], []);
    });

    const latest = getLatest(db);
    expect(latest?.gpus[0].gpuUtil).toBe(50);
  });
});
