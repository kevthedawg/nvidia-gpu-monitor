import { beforeEach, describe, expect, it } from "vitest";

import type { Db } from "../db/index.js";
import {
  getHistory,
  getLatest,
  insertMetrics,
  purgeOld,
} from "../db/queries.js";
import { atTime, FIXTURES, freshDb, hoursAgo } from "./helpers.js";

const { gpu, gpuProcess } = FIXTURES;

let db: Db;

beforeEach(() => {
  db = freshDb();
});

describe("insertMetrics", () => {
  it("stores a GPU reading with its processes", () => {
    insertMetrics(db, [gpu], [gpuProcess]);

    const latest = getLatest(db);
    expect(latest).not.toBeNull();
    expect(latest?.gpus).toHaveLength(1);
    expect(latest?.gpus[0].gpuUtil).toBe(85);
    expect(latest?.processes).toHaveLength(1);
    expect(latest?.processes[0].processName).toBe("ollama");
  });

  it("stores multiple GPUs in a single batch", () => {
    insertMetrics(db, [gpu, { ...gpu, gpuIndex: 1, gpuUtil: 20 }], []);

    const latest = getLatest(db);
    expect(latest?.gpus).toHaveLength(2);
    expect(latest?.gpus[0].gpuIndex).toBe(0);
    expect(latest?.gpus[1].gpuIndex).toBe(1);
  });

  it("works with zero processes", () => {
    insertMetrics(db, [gpu], []);

    const latest = getLatest(db);
    expect(latest?.gpus).toHaveLength(1);
    expect(latest?.processes).toHaveLength(0);
  });

  it("associates each process with the correct GPU via gpuIndex", () => {
    const proc0 = { ...gpuProcess, gpuIndex: 0, pid: 100 };
    const proc1 = { ...gpuProcess, gpuIndex: 1, pid: 200 };
    insertMetrics(db, [gpu, { ...gpu, gpuIndex: 1 }], [proc0, proc1]);

    const latest = getLatest(db);
    expect(latest).not.toBeNull();

    const gpu0Procs = latest?.processes.filter((p) => p.gpuIndex === 0);
    const gpu1Procs = latest?.processes.filter((p) => p.gpuIndex === 1);
    expect(gpu0Procs).toHaveLength(1);
    expect(gpu1Procs).toHaveLength(1);
    expect(gpu0Procs?.[0].pid).toBe(100);
    expect(gpu1Procs?.[0].pid).toBe(200);
  });
});

describe("getLatest", () => {
  it("returns null on empty database", () => {
    expect(getLatest(db)).toBeNull();
  });

  it("returns the most recent timestamp's data", () => {
    insertMetrics(db, [{ ...gpu, gpuUtil: 50 }], []);
    atTime(Date.now() + 10_000, () => {
      insertMetrics(db, [{ ...gpu, gpuUtil: 90 }], []);
    });

    expect(getLatest(db)?.gpus[0].gpuUtil).toBe(90);
  });
});

describe("getHistory", () => {
  it("returns empty array when no data exists", () => {
    expect(getHistory(db, "1h")).toHaveLength(0);
  });

  it("includes data within the requested range", () => {
    insertMetrics(db, [gpu], []);
    expect(getHistory(db, "1h")).toHaveLength(1);
  });

  it("excludes data older than the requested range", () => {
    atTime(hoursAgo(2), () => {
      insertMetrics(db, [{ ...gpu, gpuUtil: 10 }], []);
    });
    insertMetrics(db, [{ ...gpu, gpuUtil: 90 }], []);

    const oneHour = getHistory(db, "1h");
    expect(oneHour).toHaveLength(1);
    expect(oneHour[0].gpuUtil).toBe(90);

    expect(getHistory(db, "6h")).toHaveLength(2);
  });
});

describe("purgeOld", () => {
  it("deletes data older than 24 hours", () => {
    atTime(hoursAgo(25), () => {
      insertMetrics(db, [gpu], []);
    });
    insertMetrics(db, [{ ...gpu, gpuUtil: 90 }], []);

    purgeOld(db);

    const history = getHistory(db, "24h");
    expect(history).toHaveLength(1);
    expect(history[0].gpuUtil).toBe(90);
  });

  it("cascade-deletes processes of purged metrics", () => {
    atTime(hoursAgo(25), () => {
      insertMetrics(db, [gpu], [gpuProcess]);
    });

    purgeOld(db);
    expect(getLatest(db)).toBeNull();
  });

  it("preserves recent data", () => {
    insertMetrics(db, [gpu], [gpuProcess]);
    purgeOld(db);

    const latest = getLatest(db);
    expect(latest?.gpus).toHaveLength(1);
    expect(latest?.processes).toHaveLength(1);
  });
});
