import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useTimeRangeParams } from "../lib/hooks/useTimeRangeParams";
import { trpc } from "../trpc";
import { getTimestamps } from "./charts/helpers";
import { MetricCharts } from "./MetricCharts";
import { ProcessCharts } from "./ProcessCharts";
import { StatsCards } from "./StatsCards";
import { TimeRangePicker } from "./TimeRangePicker";

const POLL_INTERVAL = 5000;
const LATEST_WINDOW = 30 * 1000;

export const GpuDashboard = (): React.ReactElement => {
  const timeRange = useTimeRangeParams();
  const [now, setNow] = useState(() => Date.now());

  // Poll for current stats only when charts are viewing a historical range
  useEffect(() => {
    if (timeRange.pinToNow) return undefined;
    const id = setInterval(() => {
      setNow(Date.now());
    }, POLL_INTERVAL);
    return () => {
      clearInterval(id);
    };
  }, [timeRange.pinToNow]);

  // When pinned to now, chart `to` follows the clock
  const { setTo } = timeRange;
  useEffect(() => {
    if (!timeRange.pinToNow) return undefined;
    const id = setInterval(() => {
      setTo(Date.now());
    }, POLL_INTERVAL);
    return () => {
      clearInterval(id);
    };
  }, [timeRange.pinToNow, setTo]);

  // Only poll separately when unpinned
  const latestQuery = trpc.metrics.history.useQuery(
    { start: now - LATEST_WINDOW, end: now },
    { enabled: !timeRange.pinToNow, placeholderData: keepPreviousData },
  );

  const keepPrevious = { placeholderData: keepPreviousData };
  const history = trpc.metrics.history.useQuery(
    { start: timeRange.from, end: timeRange.to },
    keepPrevious,
  );
  const processHistory = trpc.metrics.processHistory.useQuery(
    { start: timeRange.from, end: timeRange.to },
    keepPrevious,
  );

  const historyData = history.data ?? [];
  const processData = processHistory.data ?? [];
  const timestamps = getTimestamps(historyData);

  // When pinned, history already contains latest data. When unpinned, use separate poll.
  const statsSource = timeRange.pinToNow
    ? historyData
    : (latestQuery.data ?? []);
  const latestTimestamp =
    statsSource.length > 0
      ? statsSource[statsSource.length - 1].timestamp
      : null;
  const latestGpus = latestTimestamp
    ? statsSource.filter((d) => d.timestamp === latestTimestamp)
    : [];

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
        from={timeRange.from}
        to={timeRange.to}
        pinToNow={timeRange.pinToNow}
        activePreset={timeRange.activePreset}
        onChange={timeRange.setRange}
        onPresetSelect={timeRange.setPreset}
        onPinToNowChange={timeRange.setPinToNow}
      />

      <MetricCharts
        data={historyData}
        processData={processData}
        timestamps={timestamps}
        isLoading={history.isLoading}
        onRangeSelect={timeRange.setRange}
      />

      <ProcessCharts
        data={processData}
        timestamps={timestamps}
        onRangeSelect={timeRange.setRange}
      />
    </Box>
  );
};
