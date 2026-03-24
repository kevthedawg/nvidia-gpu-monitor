import type { ChartCardProps } from "./charts";
import { ChartCard } from "./charts/ChartCard";
import type { ProcessRow } from "./charts/helpers";
import { buildProcessData } from "./charts/helpers";

const SYNC_KEY = "gpu-dashboard";

export const ProcessCharts = ({
  data,
  timestamps,
  onRangeSelect,
}: {
  data: ProcessRow[];
  timestamps?: number[];
  onRangeSelect?: ChartCardProps["onRangeSelect"];
}): React.ReactElement => {
  const { data: aligned, meta } = buildProcessData(data, { timestamps });

  return (
    <ChartCard
      title="GPU Processes"
      unit="GB VRAM"
      data={aligned}
      meta={meta}
      syncKey={SYNC_KEY}
      showLegend
      onRangeSelect={onRangeSelect}
    />
  );
};
