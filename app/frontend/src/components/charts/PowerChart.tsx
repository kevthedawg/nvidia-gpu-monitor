import type { SharedChartProps } from "./ChartCard";
import { ChartCard } from "./ChartCard";
import type { MetricRow } from "./helpers";
import { buildSeries } from "./helpers";

export const PowerChart = ({
  data,
  gpuIndices,
  ...shared
}: SharedChartProps & {
  data: MetricRow[];
  gpuIndices: number[];
}): React.ReactElement => (
  <ChartCard
    title="Power Draw"
    unit="W"
    series={buildSeries(
      data,
      "powerDraw",
      shared.timestamps,
      gpuIndices,
      "#f44336",
    )}
    {...shared}
  />
);
