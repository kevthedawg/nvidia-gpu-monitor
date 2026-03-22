import { describe, expect, it } from "vitest";

import { MetricsPayloadSchema } from "../schema.js";
import { FIXTURES } from "./helpers.js";

const { gpu, gpuProcess } = FIXTURES;

const valid = {
  gpus: [gpu],
  processes: [gpuProcess],
};

const parseGpu = (overrides: Record<string, unknown>): boolean =>
  MetricsPayloadSchema.safeParse({
    gpus: [{ ...gpu, ...overrides }],
    processes: [],
  }).success;

describe("MetricsPayloadSchema", () => {
  it("accepts a valid single-GPU payload", () => {
    expect(MetricsPayloadSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a multi-GPU payload", () => {
    expect(
      MetricsPayloadSchema.safeParse({
        gpus: [gpu, { ...gpu, gpuIndex: 1 }],
        processes: [],
      }).success,
    ).toBe(true);
  });

  it("accepts empty processes", () => {
    expect(
      MetricsPayloadSchema.safeParse({ gpus: [gpu], processes: [] }).success,
    ).toBe(true);
  });

  it("rejects empty gpus array", () => {
    expect(
      MetricsPayloadSchema.safeParse({ gpus: [], processes: [] }).success,
    ).toBe(false);
  });

  it("rejects gpuUtil > 100", () => {
    expect(parseGpu({ gpuUtil: 101 })).toBe(false);
  });

  it("rejects negative memUsed", () => {
    expect(parseGpu({ memUsed: -1 })).toBe(false);
  });

  it("rejects missing required fields", () => {
    expect(
      MetricsPayloadSchema.safeParse({
        gpus: [{ gpuIndex: 0, gpuUtil: 50 }],
        processes: [],
      }).success,
    ).toBe(false);
  });

  it("rejects non-integer gpuUtil", () => {
    expect(parseGpu({ gpuUtil: 85.5 })).toBe(false);
  });

  it("allows decimal powerDraw", () => {
    expect(parseGpu({ powerDraw: 280.7 })).toBe(true);
  });
});
