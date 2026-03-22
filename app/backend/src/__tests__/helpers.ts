import { vi } from "vitest";

import type { Db } from "../db/index.js";
import { createDb } from "../db/index.js";
import type { GpuMetrics, ProcessMetrics } from "../schema.js";

export const FIXTURES = {
  gpu: {
    gpuIndex: 0,
    gpuUtil: 85,
    memUsed: 18000,
    memTotal: 24576,
    temperature: 65,
    powerDraw: 280.5,
    gpuName: "RTX 3090",
  } satisfies GpuMetrics,

  gpuProcess: {
    gpuIndex: 0,
    pid: 1234,
    processName: "ollama",
    usedMemory: 18000,
  } satisfies ProcessMetrics,
} as const;

export const freshDb = (): Db => createDb(":memory:");

/**
 * Runs `fn` with `Date.now()` mocked to return `timestamp`,
 * then restores the real clock.
 */
export const atTime = <T>(timestamp: number, fn: () => T): T => {
  vi.spyOn(Date, "now").mockReturnValue(timestamp);
  try {
    return fn();
  } finally {
    vi.restoreAllMocks();
  }
};

const ONE_HOUR = 60 * 60 * 1000;

export const hoursAgo = (hours: number): number =>
  Date.now() - hours * ONE_HOUR;
