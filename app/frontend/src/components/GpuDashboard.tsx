import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { keepPreviousData } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { trpc } from "../trpc";
import { MetricCharts } from "./MetricCharts";
import { ProcessCharts } from "./ProcessCharts";
import { StatsCards } from "./StatsCards";
import { TimeRangePicker } from "./TimeRangePicker";

const ONE_HOUR = 60 * 60 * 1000;

export const GpuDashboard = (): React.ReactElement => {
  const [from, setFrom] = useState(() => Date.now() - ONE_HOUR);
  const [to, setTo] = useState(() => Date.now());
  const [pinToNow, setPinToNow] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>("1h");

  // Advance `to` every 5s when pinned to now.
  // This is the sole polling mechanism — the query key change triggers a refetch.
  useEffect(() => {
    if (!pinToNow) return undefined;
    const id = setInterval(() => {
      setTo(Date.now());
    }, 5000);
    return () => {
      clearInterval(id);
    };
  }, [pinToNow]);

  const keepPrevious = { placeholderData: keepPreviousData };
  const history = trpc.metrics.history.useQuery(
    { start: from, end: to },
    keepPrevious,
  );
  const processHistory = trpc.metrics.processHistory.useQuery(
    { start: from, end: to },
    keepPrevious,
  );

  const handleChange = useCallback((newFrom: number, newTo: number) => {
    setFrom(newFrom);
    setTo(newTo);
    setActivePreset(null);
  }, []);

  const handlePresetSelect = useCallback((label: string, ms: number) => {
    setFrom(Date.now() - ms);
    setTo(Date.now());
    setPinToNow(true);
    setActivePreset(label);
  }, []);

  const handlePinToNowChange = useCallback((pinned: boolean) => {
    setPinToNow(pinned);
    if (pinned) {
      setTo(Date.now());
    }
  }, []);

  const historyData = history.data ?? [];
  const processData = processHistory.data ?? [];

  // Derive current GPU stats from the latest history entries
  const latestTimestamp =
    historyData.length > 0
      ? historyData[historyData.length - 1].timestamp
      : null;
  const latestGpus = latestTimestamp
    ? historyData.filter((d) => d.timestamp === latestTimestamp)
    : [];

  if (history.isLoading && historyData.length === 0) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (history.error) {
    return (
      <Alert severity="error">
        {"Failed to connect to backend: "}
        {history.error.message}
      </Alert>
    );
  }

  if (latestGpus.length === 0) {
    return (
      <Alert severity="info">
        {"No GPU data yet. Waiting for the agent to send metrics..."}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {latestGpus.map((gpu) => (
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

      <TimeRangePicker
        from={from}
        to={to}
        pinToNow={pinToNow}
        activePreset={activePreset}
        onChange={handleChange}
        onPresetSelect={handlePresetSelect}
        onPinToNowChange={handlePinToNowChange}
      />

      <MetricCharts
        data={historyData}
        processData={processData}
        isLoading={history.isLoading}
      />

      <ProcessCharts data={processData} from={from} to={to} />
    </Box>
  );
};
