import type { SharedChartProps } from "./ChartCard";
import { ChartCard } from "./ChartCard";
import type { MetricRow, ProcessRow } from "./helpers";
import { buildSeries, buildVramSeries, MB_PER_GB } from "./helpers";

const toGb = (v: number): number => Number((v / MB_PER_GB).toFixed(1));

export const VramChart = ({
  data,
  processData,
  gpuIndices,
  ...shared
}: SharedChartProps & {
  data: MetricRow[];
  processData: ProcessRow[];
  gpuIndices: number[];
}): React.ReactElement => {
  const vramSeries = buildVramSeries(processData, shared.timestamps);

  return (
    <ChartCard
      title="VRAM Usage"
      unit="GB"
      series={
        vramSeries.length > 0
          ? vramSeries
          : buildSeries(
              data,
              "memUsed",
              shared.timestamps,
              gpuIndices,
              "#2196f3",
              toGb,
            )
      }
      {...shared}
    />
  );
};
