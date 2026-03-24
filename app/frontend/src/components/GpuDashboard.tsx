import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { keepPreviousData } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { trpc } from "../trpc";
import { getTimestamps } from "./charts/helpers";
import { MetricCharts } from "./MetricCharts";
import { ProcessCharts } from "./ProcessCharts";
import { StatsCards } from "./StatsCards";
import { TimeRangePicker } from "./TimeRangePicker";

const ONE_HOUR = 60 * 60 * 1000;
const POLL_INTERVAL = 5000;
const LATEST_WINDOW = 30 * 1000; // 30s window to catch the most recent reading

export const GpuDashboard = (): React.ReactElement => {
  const [from, setFrom] = useState(() => Date.now() - ONE_HOUR);
  const [to, setTo] = useState(() => Date.now());
  const [pinToNow, setPinToNow] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>("1h");
  const [now, setNow] = useState(() => Date.now());

  // Poll for current stats only when charts are viewing a historical range
  useEffect(() => {
    if (pinToNow) return undefined;
    const id = setInterval(() => {
      setNow(Date.now());
    }, POLL_INTERVAL);
    return () => {
      clearInterval(id);
    };
  }, [pinToNow]);

  // When pinned to now, chart `to` follows the clock
  useEffect(() => {
    if (!pinToNow) return undefined;
    const id = setInterval(() => {
      setTo(Date.now());
    }, POLL_INTERVAL);
    return () => {
      clearInterval(id);
    };
  }, [pinToNow]);

  // Only poll separately when unpinned (charts are showing a historical range)
  const latestQuery = trpc.metrics.history.useQuery(
    { start: now - LATEST_WINDOW, end: now },
    { enabled: !pinToNow, placeholderData: keepPreviousData },
  );

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

  const handleRangeSelect = useCallback((fromMs: number, toMs: number) => {
    setFrom(Math.round(fromMs));
    setTo(Math.round(toMs));
    setPinToNow(false);
    setActivePreset(null);
  }, []);

  const historyData = history.data ?? [];
  const processData = processHistory.data ?? [];
  const timestamps = getTimestamps(historyData);

  // When pinned, history already contains latest data. When unpinned, use separate poll.
  const statsSource = pinToNow ? historyData : (latestQuery.data ?? []);
  const latestTimestamp =
    statsSource.length > 0
      ? statsSource[statsSource.length - 1].timestamp
      : null;
  const latestGpus = latestTimestamp
    ? statsSource.filter((d) => d.timestamp === latestTimestamp)
    : [];

  // Only show full-page states on initial load
  if (history.error) {
    return (
      <Alert severity="error">
        {"Failed to connect to backend: "}
        {history.error.message}
      </Alert>
    );
  }

  if (
    history.isLoading &&
    historyData.length === 0 &&
    latestGpus.length === 0
  ) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {latestGpus.length === 0 ? (
        <Alert severity="info">
          {"No GPU data yet. Waiting for the agent to send metrics..."}
        </Alert>
      ) : (
        latestGpus.map((gpu) => (
          <Box key={gpu.gpuIndex}>
            <Typography variant="subtitle1" sx={{ mb: 1, opacity: 0.7 }}>
              {"GPU "}
              {gpu.gpuIndex}
              {" — "}
              {gpu.gpuName}
            </Typography>
            <StatsCards gpu={gpu} />
          </Box>
        ))
      )}

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
        timestamps={timestamps}
        isLoading={history.isLoading}
        onRangeSelect={handleRangeSelect}
      />

      <ProcessCharts
        data={processData}
        timestamps={timestamps}
        onRangeSelect={handleRangeSelect}
      />
    </Box>
  );
};
