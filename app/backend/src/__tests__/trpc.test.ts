import { beforeEach, describe, expect, it } from "vitest";

import type { Db } from "../db/index.js";
import { insertMetrics } from "../db/queries.js";
import { appRouter } from "../trpc.js";
import { atTime, FIXTURES, freshDb, hoursAgo } from "./helpers.js";

const { gpu, gpuProcess } = FIXTURES;

let db: Db;
let caller: ReturnType<typeof appRouter.createCaller>;

beforeEach(() => {
  db = freshDb();
  caller = appRouter.createCaller({ db });
});

describe("metrics.current", () => {
  it("returns null when no data exists", async () => {
    expect(await caller.metrics.current()).toBeNull();
  });

  it("returns GPU data with processes", async () => {
    insertMetrics(db, [gpu], [gpuProcess]);

    const result = await caller.metrics.current();
    expect(result?.gpus).toHaveLength(1);
    expect(result?.gpus[0].gpuUtil).toBe(85);
    expect(result?.processes).toHaveLength(1);
    expect(result?.processes[0].processName).toBe("ollama");
  });
});

describe("metrics.history", () => {
  it("returns empty array when no data exists", async () => {
    expect(await caller.metrics.history({ range: "1h" })).toHaveLength(0);
  });

  it("respects the range parameter", async () => {
    atTime(hoursAgo(2), () => {
      insertMetrics(db, [gpu], []);
    });
    insertMetrics(db, [gpu], []);

    expect(await caller.metrics.history({ range: "1h" })).toHaveLength(1);
    expect(await caller.metrics.history({ range: "6h" })).toHaveLength(2);
  });
});
