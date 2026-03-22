import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const metrics = sqliteTable(
  "metrics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    timestamp: integer("timestamp").notNull(),
    gpuIndex: integer("gpu_index").notNull(),
    gpuUtil: integer("gpu_util").notNull(),
    memUsed: integer("mem_used").notNull(),
    memTotal: integer("mem_total").notNull(),
    temperature: integer("temperature").notNull(),
    powerDraw: real("power_draw").notNull(),
    gpuName: text("gpu_name").notNull(),
  },
  (table) => [index("idx_metrics_timestamp").on(table.timestamp)],
);

export const processes = sqliteTable(
  "processes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    metricId: integer("metric_id")
      .notNull()
      .references(() => metrics.id, { onDelete: "cascade" }),
    gpuIndex: integer("gpu_index").notNull(),
    pid: integer("pid").notNull(),
    processName: text("process_name").notNull(),
    usedMemory: integer("used_memory").notNull(),
  },
  (table) => [index("idx_processes_metric_id").on(table.metricId)],
);
