import type uPlot from "uplot";

// ── Types ──────────────────────────────────────

export interface MetricRow {
  timestamp: number;
  gpuIndex: number;
  gpuUtil: number;
  memUsed: number;
  temperature: number;
  powerDraw: number;
}

export interface ProcessRow {
  timestamp: number;
  gpuIndex: number;
  pid: number;
  processName: string;
  usedMemory: number;
}

type StrokeFn = (u: uPlot, seriesIdx: number) => CanvasGradient;

export interface SeriesMeta {
  label: string;
  color: string;
  fill?: string | StrokeFn;
  stroke?: StrokeFn;
  /** Resolve a hex color from a data value (for dynamic per-point coloring) */
  colorFromValue?: (val: number) => string;
}

// ── Constants ──────────────────────────────────

export const MB_PER_GB = 1024;

export const PROCESS_COLORS = [
  "#2196f3",
  "#4caf50",
  "#ff9800",
  "#e91e63",
  "#9c27b0",
];

export const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// ── Data builders ──────────────────────────────
//
// uPlot expects "aligned data": an array of arrays where:
//   - index 0 is the shared x-axis (timestamps in seconds)
//   - index 1..N are the y-values for each series
//
// Our backend sends rows with ms timestamps. We:
//   1. Collect all unique timestamps, sort them, convert to seconds
//   2. For each series, create a Map of timestamp→value
//   3. Walk through the sorted timestamps, looking up each value
//
// This keeps timestamps as the single source of truth and avoids
// any floating-point issues from dividing timestamps.

type NumericKey = "gpuUtil" | "memUsed" | "temperature" | "powerDraw";

/**
 * Get sorted unique timestamps from rows (in seconds for uPlot).
 */
export const getTimestamps = (rows: { timestamp: number }[]): number[] => {
  const unique = [...new Set(rows.map((r) => r.timestamp))];
  unique.sort((a, b) => a - b);
  return unique.map((t) => t / 1000);
};

/**
 * Build chart data for a single GPU metric (e.g. temperature, power).
 *
 * Input:  rows from the backend, a metric key, and which GPUs to include
 * Output: columnar data for uPlot + series metadata for labels/colors
 */
export const buildMetricData = (
  rows: MetricRow[],
  key: NumericKey,
  gpuIndices: number[],
  color: string,
  options?: { transform?: (v: number) => number; timestamps?: number[] },
): { data: uPlot.AlignedData; meta: SeriesMeta[] } => {
  const fn = options?.transform ?? ((v: number): number => v);
  const timestamps = options?.timestamps ?? getTimestamps(rows);

  const meta: SeriesMeta[] = [];
  const seriesArrays: (number | null)[][] = [];

  for (const gpuIdx of gpuIndices) {
    // Build a lookup: timestamp (ms) → value
    const valueByMs = new Map<number, number>();
    for (const row of rows) {
      if (row.gpuIndex === gpuIdx) {
        valueByMs.set(row.timestamp, fn(row[key]));
      }
    }

    // Walk timestamps in order, look up each value
    const values = timestamps.map((tSec) => {
      const tMs = Math.round(tSec * 1000);
      return valueByMs.get(tMs) ?? null;
    });

    seriesArrays.push(values);
    meta.push({
      label: gpuIndices.length > 1 ? `GPU ${String(gpuIdx)}` : key,
      color,
      fill: `${color}26`,
    });
  }

  return {
    data: [timestamps, ...seriesArrays],
    meta,
  };
};

/**
 * Build chart data for per-process VRAM usage over time.
 *
 * Each unique process (by pid + name) gets its own series.
 * Values are in GB (converted from MiB).
 *
 * When `stacked` is true, each series value includes the sum of all
 * previous series — this makes uPlot render a stacked area chart.
 * The meta also includes `fill` for the area color.
 */
export const buildProcessData = (
  processRows: ProcessRow[],
  options?: { stacked?: boolean; timestamps?: number[] },
): { data: uPlot.AlignedData; meta: SeriesMeta[] } => {
  if (processRows.length === 0) {
    return { data: [options?.timestamps ?? [], []], meta: [] };
  }

  const timestamps = options?.timestamps ?? getTimestamps(processRows);

  // Find all unique processes
  const processMap = new Map<string, { pid: number; name: string }>();
  for (const row of processRows) {
    const key = `${String(row.pid)}:${row.processName}`;
    if (!processMap.has(key)) {
      processMap.set(key, { pid: row.pid, name: row.processName });
    }
  }
  const uniqueProcesses = [...processMap.values()];

  const meta: SeriesMeta[] = [];
  const seriesArrays: (number | null)[][] = [];

  for (let i = 0; i < uniqueProcesses.length; i++) {
    const proc = uniqueProcesses[i];
    const color = PROCESS_COLORS[i % PROCESS_COLORS.length];

    // Build lookup: timestamp (ms) → VRAM in GB
    const vramByMs = new Map<number, number>();
    for (const row of processRows) {
      if (row.pid === proc.pid && row.processName === proc.name) {
        vramByMs.set(row.timestamp, row.usedMemory / MB_PER_GB);
      }
    }

    const values = timestamps.map((tSec) => {
      const tMs = Math.round(tSec * 1000);
      return vramByMs.get(tMs) ?? null;
    });

    seriesArrays.push(values);
    meta.push({
      label: `${proc.name} (${String(proc.pid)})`,
      color,
      ...(options?.stacked ? { fill: `${color}26` } : {}),
    });
  }

  // Pre-stack: each series becomes the cumulative sum of itself + all prior
  if (options?.stacked && seriesArrays.length > 1) {
    for (let s = 1; s < seriesArrays.length; s++) {
      for (let t = 0; t < timestamps.length; t++) {
        const prev = seriesArrays[s - 1][t];
        const curr = seriesArrays[s][t];
        if (prev !== null && curr !== null) {
          seriesArrays[s][t] = prev + curr;
        }
      }
    }
  }

  return {
    data: [timestamps, ...seriesArrays],
    meta,
  };
};
