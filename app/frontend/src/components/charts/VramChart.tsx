import type { ChartCardProps } from "./ChartCard";
import { ChartCard } from "./ChartCard";
import type { MetricRow, ProcessRow } from "./helpers";
import { buildMetricData, buildProcessData, MB_PER_GB } from "./helpers";

const toGb = (v: number): number => Number((v / MB_PER_GB).toFixed(1));

export const VramChart = ({
  data,
  processData,
  gpuIndices,
  timestamps,
  syncKey,
  onRangeSelect,
}: {
  data: MetricRow[];
  processData: ProcessRow[];
  gpuIndices: number[];
  timestamps?: number[];
  syncKey?: string;
  onRangeSelect?: ChartCardProps["onRangeSelect"];
}): React.ReactElement => {
  // Prefer per-process breakdown when available, fall back to total
  const processResult = buildProcessData(processData, {
    stacked: true,
    timestamps,
  });
  const hasProcessData = processResult.meta.length > 0;

  const { data: aligned, meta } = hasProcessData
    ? processResult
    : buildMetricData(data, "memUsed", gpuIndices, "#2196f3", {
        transform: toGb,
        timestamps,
      });

  return (
    <ChartCard
      title="VRAM Usage"
      unit="GB"
      data={aligned}
      meta={meta}
      syncKey={syncKey}
      showLegend
      onRangeSelect={onRangeSelect}
    />
  );
};
