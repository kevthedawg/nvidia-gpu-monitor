import { beforeEach, describe, expect, it } from "vitest";

import type { Db } from "../db/index.js";
import { insertMetrics } from "../db/queries.js";
import { appRouter } from "../trpc.js";
import { atTime, FIXTURES, freshDb, hoursAgo } from "./helpers.js";

const { gpu, gpuProcess } = FIXTURES;

let db: Db;
let caller: ReturnType<typeof appRouter.createCaller>;

const now = (): number => Date.now();
const oneHourAgo = (): number => now() - 60 * 60 * 1000;
const sixHoursAgo = (): number => now() - 6 * 60 * 60 * 1000;

beforeEach(() => {
  db = freshDb();
  caller = appRouter.createCaller({ db });
});

describe("metrics.history", () => {
  it("returns empty array when no data exists", async () => {
    const result = await caller.metrics.history({
      start: oneHourAgo(),
      end: now(),
    });
    expect(result).toHaveLength(0);
  });

  it("returns data within range", async () => {
    insertMetrics(db, [gpu], []);

    const result = await caller.metrics.history({
      start: oneHourAgo(),
      end: now(),
    });
    expect(result).toHaveLength(1);
    expect(result[0].gpuUtil).toBe(85);
  });

  it("respects start/end boundaries", async () => {
    atTime(hoursAgo(2), () => {
      insertMetrics(db, [gpu], []);
    });
    insertMetrics(db, [gpu], []);

    const oneHour = await caller.metrics.history({
      start: oneHourAgo(),
      end: now(),
    });
    expect(oneHour).toHaveLength(1);

    const sixHours = await caller.metrics.history({
      start: sixHoursAgo(),
      end: now(),
    });
    expect(sixHours).toHaveLength(2);
  });
});

describe("metrics.processHistory", () => {
  it("returns empty array when no processes exist", async () => {
    insertMetrics(db, [gpu], []);

    const result = await caller.metrics.processHistory({
      start: oneHourAgo(),
      end: now(),
    });
    expect(result).toHaveLength(0);
  });

  it("returns process data within range", async () => {
    insertMetrics(db, [gpu], [gpuProcess]);

    const result = await caller.metrics.processHistory({
      start: oneHourAgo(),
      end: now(),
    });
    expect(result).toHaveLength(1);
    expect(result[0].processName).toBe("ollama");
    expect(result[0].pid).toBe(1234);
  });
});
