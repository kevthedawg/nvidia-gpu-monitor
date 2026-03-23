import { and, eq, gte, lte, sql } from "drizzle-orm";

import type { GpuMetrics, ProcessMetrics } from "../schema.js";
import type { Db } from "./index.js";
import { metrics, processes } from "./schema.js";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

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

export const getHistory = (
  db: Db,
  start: number,
  end: number,
): (typeof metrics.$inferSelect)[] =>
  db
    .select()
    .from(metrics)
    .where(and(gte(metrics.timestamp, start), lte(metrics.timestamp, end)))
    .orderBy(metrics.timestamp)
    .all();

export const getProcessHistory = (
  db: Db,
  start: number,
  end: number,
): {
  timestamp: number;
  gpuIndex: number;
  pid: number;
  processName: string;
  usedMemory: number;
}[] =>
  db
    .select({
      timestamp: metrics.timestamp,
      gpuIndex: processes.gpuIndex,
      pid: processes.pid,
      processName: processes.processName,
      usedMemory: processes.usedMemory,
    })
    .from(processes)
    .innerJoin(metrics, eq(processes.metricId, metrics.id))
    .where(and(gte(metrics.timestamp, start), lte(metrics.timestamp, end)))
    .orderBy(metrics.timestamp)
    .all();

export const purgeOld = (db: Db): void => {
  const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
  db.delete(metrics)
    .where(sql`${metrics.timestamp} < ${cutoff}`)
    .run();
};
