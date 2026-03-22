import { z } from "zod";

const GpuMetricsSchema = z.object({
  gpuIndex: z.number().int().min(0),
  gpuUtil: z.number().int().min(0).max(100),
  memUsed: z.number().int().min(0),
  memTotal: z.number().int().min(0),
  temperature: z.number().int(),
  powerDraw: z.number().min(0),
  gpuName: z.string().min(1),
});

const ProcessMetricsSchema = z.object({
  gpuIndex: z.number().int().min(0),
  pid: z.number().int().min(0),
  usedMemory: z.number().int().min(0),
  processName: z.string().min(1),
});

export const MetricsPayloadSchema = z.object({
  gpus: z.array(GpuMetricsSchema).min(1),
  processes: z.array(ProcessMetricsSchema),
});

export type GpuMetrics = z.infer<typeof GpuMetricsSchema>;
export type ProcessMetrics = z.infer<typeof ProcessMetricsSchema>;
export type MetricsPayload = z.infer<typeof MetricsPayloadSchema>;
