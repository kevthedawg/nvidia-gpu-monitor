import { desc, gte, inArray, sql } from "drizzle-orm";

import type { GpuMetrics, ProcessMetrics } from "../schema.js";
import type { Db } from "./index.js";
import { metrics, processes } from "./schema.js";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

type TimeRange = "1h" | "6h" | "24h";

const rangeToMs: Record<TimeRange, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": TWENTY_FOUR_HOURS_MS,
};

export const insertMetrics = (
  db: Db,
  gpus: GpuMetrics[],
  procs: ProcessMetrics[],
): void => {
  const now = Date.now();

  db.transaction((tx) => {
    for (const gpu of gpus) {
      const rows = tx
        .insert(metrics)
        .values({
          timestamp: now,
          gpuIndex: gpu.gpuIndex,
          gpuUtil: gpu.gpuUtil,
          memUsed: gpu.memUsed,
          memTotal: gpu.memTotal,
          temperature: gpu.temperature,
          powerDraw: gpu.powerDraw,
          gpuName: gpu.gpuName,
        })
        .returning({ id: metrics.id })
        .all();

      const gpuProcesses = procs.filter((p) => p.gpuIndex === gpu.gpuIndex);
      if (gpuProcesses.length > 0 && rows.length > 0) {
        tx.insert(processes)
          .values(
            gpuProcesses.map((p) => ({
              metricId: rows[0].id,
              gpuIndex: p.gpuIndex,
              pid: p.pid,
              processName: p.processName,
              usedMemory: p.usedMemory,
            })),
          )
          .run();
      }
    }
  });
};

export const getLatest = (
  db: Db,
): {
  gpus: (typeof metrics.$inferSelect)[];
  processes: (typeof processes.$inferSelect)[];
} | null => {
  const latestTimestamp = db
    .select({ timestamp: metrics.timestamp })
    .from(metrics)
    .orderBy(desc(metrics.timestamp))
    .limit(1)
    .get();

  if (!latestTimestamp) {
    return null;
  }

  const gpuRows = db
    .select()
    .from(metrics)
    .where(sql`${metrics.timestamp} = ${latestTimestamp.timestamp}`)
    .all();

  const metricIds = gpuRows.map((r) => r.id);
  const processRows =
    metricIds.length > 0
      ? db
          .select()
          .from(processes)
          .where(inArray(processes.metricId, metricIds))
          .all()
      : [];

  return { gpus: gpuRows, processes: processRows };
};

export const getHistory = (
  db: Db,
  range: TimeRange,
): (typeof metrics.$inferSelect)[] => {
  const ms = rangeToMs[range];
  const since = Date.now() - ms;

  return db
    .select()
    .from(metrics)
    .where(gte(metrics.timestamp, since))
    .orderBy(metrics.timestamp)
    .all();
};

export const purgeOld = (db: Db): void => {
  const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
  db.delete(metrics)
    .where(sql`${metrics.timestamp} < ${cutoff}`)
    .run();
};
