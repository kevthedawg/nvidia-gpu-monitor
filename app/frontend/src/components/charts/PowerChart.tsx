import type { ChartCardProps } from "./ChartCard";
import { ChartCard } from "./ChartCard";
import type { MetricRow } from "./helpers";
import { buildMetricData } from "./helpers";

export const PowerChart = ({
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
    "powerDraw",
    gpuIndices,
    "#f44336",
    { timestamps },
  );

  return (
    <ChartCard
      title="Power Draw"
      unit="W"
      data={aligned}
      meta={meta}
      syncKey={syncKey}
      onRangeSelect={onRangeSelect}
    />
  );
};
