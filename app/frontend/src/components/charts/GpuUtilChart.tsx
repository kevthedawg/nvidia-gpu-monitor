import type { SharedChartProps } from "./ChartCard";
import { ChartCard } from "./ChartCard";
import type { MetricRow } from "./helpers";
import { buildSeries } from "./helpers";

export const GpuUtilChart = ({
  data,
  gpuIndices,
  ...shared
}: SharedChartProps & {
  data: MetricRow[];
  gpuIndices: number[];
}): React.ReactElement => (
  <ChartCard
    title="GPU Utilization"
    unit="%"
    series={buildSeries(
      data,
      "gpuUtil",
      shared.timestamps,
      gpuIndices,
      "#76b900",
    )}
    {...shared}
  />
);
