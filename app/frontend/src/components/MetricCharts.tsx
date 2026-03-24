import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

import type { ChartCardProps, MetricRow, ProcessRow } from "./charts";
import {
  GpuUtilChart,
  PowerChart,
  TemperatureChart,
  VramChart,
} from "./charts";
import { getTimestamps } from "./charts/helpers";

const SYNC_KEY = "gpu-dashboard";

export const MetricCharts = ({
  data,
  processData,
  timestamps: externalTimestamps,
  isLoading,
  onRangeSelect,
}: {
  data: MetricRow[];
  processData: ProcessRow[];
  timestamps?: number[];
  isLoading: boolean;
  onRangeSelect?: ChartCardProps["onRangeSelect"];
}): React.ReactElement => {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const gpuIndices = [...new Set(data.map((d) => d.gpuIndex))].sort(
    (a, b) => a - b,
  );
  const timestamps = externalTimestamps ?? getTimestamps(data);
  const shared = {
    data,
    gpuIndices,
    timestamps,
    syncKey: SYNC_KEY,
    onRangeSelect,
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 2,
      }}
    >
      <GpuUtilChart {...shared} />
      <VramChart {...shared} processData={processData} />
      <TemperatureChart {...shared} />
      <PowerChart {...shared} />
    </Box>
  );
};
