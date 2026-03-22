import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { trpc } from "../trpc";
import { MetricCharts } from "./MetricCharts";
import { ProcessList } from "./ProcessList";
import { StatsCards } from "./StatsCards";

type TimeRange = "1h" | "6h" | "24h";

export const GpuDashboard = (): React.ReactElement => {
  const [range, setRange] = useState<TimeRange>("1h");

  const current = trpc.metrics.current.useQuery();
  const history = trpc.metrics.history.useQuery({ range });

  if (current.isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (current.error) {
    return (
      <Alert severity="error">
        {"Failed to connect to backend: "}
        {current.error.message}
      </Alert>
    );
  }

  if (!current.data) {
    return (
      <Alert severity="info">
        {"No GPU data yet. Waiting for the agent to send metrics..."}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {current.data.gpus.map((gpu) => (
        <Box key={gpu.gpuIndex}>
          <Typography variant="subtitle1" sx={{ mb: 1, opacity: 0.7 }}>
            {"GPU "}
            {gpu.gpuIndex}
            {" — "}
            {gpu.gpuName}
          </Typography>
          <StatsCards gpu={gpu} />
        </Box>
      ))}

      <ProcessList processes={current.data.processes} />

      <Box>
        <Tabs
          value={range}
          onChange={(_, v: TimeRange) => {
            setRange(v);
          }}
          sx={{ mb: 2 }}
        >
          <Tab label="1 Hour" value="1h" />
          <Tab label="6 Hours" value="6h" />
          <Tab label="24 Hours" value="24h" />
        </Tabs>
        <MetricCharts data={history.data ?? []} isLoading={history.isLoading} />
      </Box>
    </Box>
  );
};
