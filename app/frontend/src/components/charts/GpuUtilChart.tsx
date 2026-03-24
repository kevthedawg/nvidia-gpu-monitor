import type { ChartCardProps } from "./ChartCard";
import { ChartCard } from "./ChartCard";
import type { MetricRow } from "./helpers";
import { buildMetricData } from "./helpers";

export const GpuUtilChart = ({
  data,
  gpuIndices,
  timestamps,
  syncKey,
  onRangeSelect,
}: {
  data: MetricRow[];
  gpuIndices: number[];
  timestamps?: number[];
  syncKey?: string;
  onRangeSelect?: ChartCardProps["onRangeSelect"];
}): React.ReactElement => {
  const { data: aligned, meta } = buildMetricData(
    data,
    "gpuUtil",
    gpuIndices,
    "#76b900",
    { timestamps },
  );

  return (
    <ChartCard
      title="GPU Utilization"
      unit="%"
      data={aligned}
      meta={meta}
      scales={{ y: { range: [0, 100] } }}
      syncKey={syncKey}
      onRangeSelect={onRangeSelect}
    />
  );
};
