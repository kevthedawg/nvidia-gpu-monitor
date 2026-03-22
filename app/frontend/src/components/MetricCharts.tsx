import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";

interface MetricRow {
  timestamp: number;
  gpuIndex: number;
  gpuUtil: number;
  memUsed: number;
  temperature: number;
  powerDraw: number;
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

interface ChartCardProps {
  title: string;
  data: MetricRow[];
  dataKey: keyof MetricRow;
  unit: string;
  color: string;
  gpuIndices: number[];
}

const ChartCard = ({
  title,
  data,
  dataKey,
  unit,
  color,
  gpuIndices,
}: ChartCardProps): React.ReactElement => {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ opacity: 0.6 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.4 }}>
            {"No data for this time range"}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const timestamps = [...new Set(data.map((d) => d.timestamp))].sort(
    (a, b) => a - b,
  );

  const series = gpuIndices.map((idx) => {
    const gpuData = data.filter((d) => d.gpuIndex === idx);
    const dataMap = new Map(gpuData.map((d) => [d.timestamp, d[dataKey]]));

    return {
      data: timestamps.map((t) => dataMap.get(t) ?? null),
      label: gpuIndices.length > 1 ? `GPU ${String(idx)}` : title,
      showMark: false,
      color,
    };
  });

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.6 }}>
          {title}
          {` (${unit})`}
        </Typography>
        <LineChart
          height={200}
          skipAnimation
          series={series}
          xAxis={[
            {
              scaleType: "time",
              data: timestamps.map((t) => new Date(t)),
              valueFormatter: (v: Date) => timeFormatter.format(v),
            },
          ]}
          margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
        />
      </CardContent>
    </Card>
  );
};

export const MetricCharts = ({
  data,
  isLoading,
}: {
  data: MetricRow[];
  isLoading: boolean;
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

  const charts: ChartCardProps[] = [
    {
      title: "GPU Utilization",
      dataKey: "gpuUtil",
      unit: "%",
      color: "#76b900",
      data,
      gpuIndices,
    },
    {
      title: "VRAM Usage",
      dataKey: "memUsed",
      unit: "MB",
      color: "#2196f3",
      data,
      gpuIndices,
    },
    {
      title: "Temperature",
      dataKey: "temperature",
      unit: "°C",
      color: "#ff9800",
      data,
      gpuIndices,
    },
    {
      title: "Power Draw",
      dataKey: "powerDraw",
      unit: "W",
      color: "#f44336",
      data,
      gpuIndices,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gap: 2,
      }}
    >
      {charts.map((chart) => (
        <ChartCard key={chart.dataKey} {...chart} />
      ))}
    </Box>
  );
};
