import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import type { AxisItemIdentifier } from "@mui/x-charts/models";
import { useState } from "react";

import type { MetricRow, ProcessRow } from "./charts";
import {
  GpuUtilChart,
  PowerChart,
  TemperatureChart,
  VramChart,
} from "./charts";

export const MetricCharts = ({
  data,
  processData,
  isLoading,
}: {
  data: MetricRow[];
  processData: ProcessRow[];
  isLoading: boolean;
}): React.ReactElement => {
  const [highlightedAxis, setHighlightedAxis] = useState<AxisItemIdentifier[]>(
    [],
  );

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
  const timestamps = [...new Set(data.map((d) => d.timestamp))].sort(
    (a, b) => a - b,
  );
  const shared = {
    data,
    gpuIndices,
    timestamps,
    highlightedAxis,
    onHighlightedAxisChange: setHighlightedAxis,
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
