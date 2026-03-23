import { Hono } from "hono";

import { beforeEach, describe, expect, it } from "vitest";

import type { Db } from "../db/index.js";
import { getHistory, getProcessHistory } from "../db/queries.js";
import { metricsApp } from "../routes.js";
import { atTime, FIXTURES, freshDb } from "./helpers.js";

const { gpu, gpuProcess } = FIXTURES;

const validPayload = {
  gpus: [gpu],
  processes: [gpuProcess],
};

let db: Db;
let post: (body: unknown) => Response | Promise<Response>;

const now = (): number => Date.now();
const oneHourAgo = (): number => now() - 60 * 60 * 1000;

beforeEach(() => {
  db = freshDb();
  const app = new Hono<{ Variables: { db: Db } }>();
  app.use("*", async (c, next) => {
    c.set("db", db);
    await next();
  });
  app.route("/api", metricsApp);

  post = (body: unknown): Response | Promise<Response> =>
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

    const history = getHistory(db, oneHourAgo(), now());
    expect(history).toHaveLength(1);

    const processes = getProcessHistory(db, oneHourAgo(), now());
    expect(processes).toHaveLength(1);
  });

  it("returns 400 with error status for invalid payload", async () => {
    const res = await post({ gpus: [], processes: [] });
    expect(res.status).toBe(400);

    const json = (await res.json()) as { status: string };
    expect(json.status).toBe("error");
  });

  it("does not store anything on invalid payload", async () => {
    await post({ foo: "bar" });
    expect(getHistory(db, oneHourAgo(), now())).toHaveLength(0);
  });

  it("most recent POST is reflected in history", async () => {
    await post(validPayload);

    const { insertMetrics } = await import("../db/queries.js");
    atTime(Date.now() + 10_000, () => {
      insertMetrics(db, [{ ...gpu, gpuUtil: 50 }], []);
    });

    const history = getHistory(db, oneHourAgo(), now() + 20_000);
    expect(history).toHaveLength(2);
    expect(history[1].gpuUtil).toBe(50);
  });
});
