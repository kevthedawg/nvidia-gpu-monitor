import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";

import type { SharedChartProps } from "./ChartCard";
import { ChartCard } from "./ChartCard";
import type { MetricRow } from "./helpers";
import { buildSeries } from "./helpers";

const TEMP_ZONES = [
  { y: 50, color: "#76b900", label: "50°C" },
  { y: 70, color: "#ff9800", label: "70°C" },
  { y: 85, color: "#f44336", label: "85°C" },
];

export const TemperatureChart = ({
  data,
  gpuIndices,
  ...shared
}: SharedChartProps & {
  data: MetricRow[];
  gpuIndices: number[];
}): React.ReactElement => (
  <ChartCard
    title="Temperature"
    unit="°C"
    series={buildSeries(
      data,
      "temperature",
      shared.timestamps,
      gpuIndices,
      "#ff9800",
    )}
    {...shared}
  >
    {TEMP_ZONES.map((zone) => (
      <ChartsReferenceLine
        key={zone.y}
        y={zone.y}
        lineStyle={{ stroke: zone.color, strokeDasharray: "4 4" }}
        labelStyle={{ fill: zone.color, fontSize: 11 }}
        label={zone.label}
      />
    ))}
  </ChartCard>
);
