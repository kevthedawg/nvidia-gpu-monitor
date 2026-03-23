import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";

import type { ProcessRow } from "./charts/helpers";
import { MB_PER_GB, PROCESS_COLORS, timeFormatter } from "./charts/helpers";

const getUniqueProcesses = (
  data: ProcessRow[],
): { pid: number; processName: string; gpuIndex: number }[] => {
  const seen = new Set<string>();
  const result: { pid: number; processName: string; gpuIndex: number }[] = [];

  for (const row of data) {
    const key = `${String(row.pid)}-${row.processName}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({
        pid: row.pid,
        processName: row.processName,
        gpuIndex: row.gpuIndex,
      });
    }
  }

  return result;
};

export const ProcessCharts = ({
  data,
  from,
  to,
}: {
  data: ProcessRow[];
  from: number;
  to: number;
}): React.ReactElement => {
  const processes = getUniqueProcesses(data);

  if (processes.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ opacity: 0.6 }}>
            {"No GPU processes in this time range"}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Use all timestamps from process data for the shared x-axis
  const timestamps = [...new Set(data.map((d) => d.timestamp))].sort(
    (a, b) => a - b,
  );

  const series = processes.map((proc, i) => {
    const byTimestamp = new Map<number, number>();
    for (const row of data) {
      if (row.pid === proc.pid && row.processName === proc.processName) {
        byTimestamp.set(row.timestamp, row.usedMemory / MB_PER_GB);
      }
    }

    return {
      data: timestamps.map((t) => byTimestamp.get(t) ?? null),
      label: `${proc.processName} (${String(proc.pid)})`,
      showMark: false,
      color: PROCESS_COLORS[i % PROCESS_COLORS.length],
    };
  });

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.6 }}>
          {"GPU Processes — VRAM (GB)"}
        </Typography>
        <LineChart
          height={250}
          skipAnimation
          series={series}
          xAxis={[
            {
              scaleType: "time",
              data: timestamps.map((t) => new Date(t)),
              min: from,
              max: to,
              valueFormatter: (v: Date) => timeFormatter.format(v),
            },
          ]}
          margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
        />
      </CardContent>
    </Card>
  );
};
