import { beforeEach, describe, expect, it } from "vitest";

import type { Db } from "../db/index.js";
import {
  getHistory,
  getProcessHistory,
  insertMetrics,
  purgeOld,
} from "../db/queries.js";
import { atTime, FIXTURES, freshDb, hoursAgo } from "./helpers.js";

const { gpu, gpuProcess } = FIXTURES;

let db: Db;

beforeEach(() => {
  db = freshDb();
});

const now = (): number => Date.now();
const oneHourAgo = (): number => now() - 60 * 60 * 1000;
const sixHoursAgo = (): number => now() - 6 * 60 * 60 * 1000;
const twentyFourHoursAgo = (): number => now() - 24 * 60 * 60 * 1000;

describe("insertMetrics", () => {
  it("stores a GPU reading with its processes", () => {
    insertMetrics(db, [gpu], [gpuProcess]);

    const history = getHistory(db, oneHourAgo(), now());
    expect(history).toHaveLength(1);
    expect(history[0].gpuUtil).toBe(85);

    const procs = getProcessHistory(db, oneHourAgo(), now());
    expect(procs).toHaveLength(1);
    expect(procs[0].processName).toBe("ollama");
  });

  it("stores multiple GPUs in a single batch", () => {
    insertMetrics(db, [gpu, { ...gpu, gpuIndex: 1, gpuUtil: 20 }], []);

    const history = getHistory(db, oneHourAgo(), now());
    expect(history).toHaveLength(2);
    expect(history[0].gpuIndex).toBe(0);
    expect(history[1].gpuIndex).toBe(1);
  });

  it("works with zero processes", () => {
    insertMetrics(db, [gpu], []);

    const procs = getProcessHistory(db, oneHourAgo(), now());
    expect(procs).toHaveLength(0);
  });

  it("associates each process with the correct GPU via gpuIndex", () => {
    const proc0 = { ...gpuProcess, gpuIndex: 0, pid: 100 };
    const proc1 = { ...gpuProcess, gpuIndex: 1, pid: 200 };
    insertMetrics(db, [gpu, { ...gpu, gpuIndex: 1 }], [proc0, proc1]);

    const procs = getProcessHistory(db, oneHourAgo(), now());
    expect(procs).toHaveLength(2);

    const gpu0Procs = procs.filter((p) => p.gpuIndex === 0);
    const gpu1Procs = procs.filter((p) => p.gpuIndex === 1);
    expect(gpu0Procs).toHaveLength(1);
    expect(gpu1Procs).toHaveLength(1);
    expect(gpu0Procs[0].pid).toBe(100);
    expect(gpu1Procs[0].pid).toBe(200);
  });
});

describe("getHistory", () => {
  it("returns empty array when no data exists", () => {
    expect(getHistory(db, oneHourAgo(), now())).toHaveLength(0);
  });

  it("includes data within the requested range", () => {
    insertMetrics(db, [gpu], []);
    expect(getHistory(db, oneHourAgo(), now())).toHaveLength(1);
  });

  it("excludes data outside the requested range", () => {
    atTime(hoursAgo(2), () => {
      insertMetrics(db, [{ ...gpu, gpuUtil: 10 }], []);
    });
    insertMetrics(db, [{ ...gpu, gpuUtil: 90 }], []);

    const oneHour = getHistory(db, oneHourAgo(), now());
    expect(oneHour).toHaveLength(1);
    expect(oneHour[0].gpuUtil).toBe(90);

    const sixHours = getHistory(db, sixHoursAgo(), now());
    expect(sixHours).toHaveLength(2);
  });
});

describe("getProcessHistory", () => {
  it("returns processes within the requested range", () => {
    insertMetrics(db, [gpu], [gpuProcess]);
    const procs = getProcessHistory(db, oneHourAgo(), now());
    expect(procs).toHaveLength(1);
    expect(procs[0].pid).toBe(1234);
  });

  it("excludes processes outside the range", () => {
    atTime(hoursAgo(2), () => {
      insertMetrics(db, [gpu], [gpuProcess]);
    });

    const procs = getProcessHistory(db, oneHourAgo(), now());
    expect(procs).toHaveLength(0);
  });
});

describe("purgeOld", () => {
  it("deletes data older than 24 hours", () => {
    atTime(hoursAgo(25), () => {
      insertMetrics(db, [gpu], []);
    });
    insertMetrics(db, [{ ...gpu, gpuUtil: 90 }], []);

    purgeOld(db);

    const history = getHistory(db, twentyFourHoursAgo(), now());
    expect(history).toHaveLength(1);
    expect(history[0].gpuUtil).toBe(90);
  });

  it("cascade-deletes processes of purged metrics", () => {
    atTime(hoursAgo(25), () => {
      insertMetrics(db, [gpu], [gpuProcess]);
    });

    purgeOld(db);

    const procs = getProcessHistory(db, twentyFourHoursAgo(), now());
    expect(procs).toHaveLength(0);
  });

  it("preserves recent data", () => {
    insertMetrics(db, [gpu], [gpuProcess]);
    purgeOld(db);

    const history = getHistory(db, oneHourAgo(), now());
    expect(history).toHaveLength(1);

    const procs = getProcessHistory(db, oneHourAgo(), now());
    expect(procs).toHaveLength(1);
  });
});
