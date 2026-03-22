import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

interface GpuStats {
  gpuUtil: number;
  memUsed: number;
  memTotal: number;
  temperature: number;
  powerDraw: number;
}

const formatMemory = (mb: number): string => {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${String(mb)} MB`;
};

const getTemperatureColor = (temp: number): string => {
  if (temp >= 85) return "#f44336";
  if (temp >= 70) return "#ff9800";
  return "#76b900";
};

const getUtilColor = (util: number): string => {
  if (util >= 90) return "#f44336";
  if (util >= 70) return "#ff9800";
  return "#76b900";
};

interface StatCardProps {
  label: string;
  value: string;
  progress?: number;
  color?: string;
}

const StatCard = ({
  label,
  value,
  progress,
  color = "#76b900",
}: StatCardProps): React.ReactElement => {
  return (
    <Card sx={{ flex: 1, minWidth: 160 }}>
      <CardContent>
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.5, color }}>
          {value}
        </Typography>
        {progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              mt: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: "rgba(255,255,255,0.08)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: color,
                borderRadius: 3,
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export const StatsCards = ({ gpu }: { gpu: GpuStats }): React.ReactElement => {
  const memPercent = Math.round((gpu.memUsed / gpu.memTotal) * 100);

  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      <StatCard
        label="GPU Utilization"
        value={`${String(gpu.gpuUtil)}%`}
        progress={gpu.gpuUtil}
        color={getUtilColor(gpu.gpuUtil)}
      />
      <StatCard
        label="VRAM"
        value={`${formatMemory(gpu.memUsed)} / ${formatMemory(gpu.memTotal)}`}
        progress={memPercent}
        color={getUtilColor(memPercent)}
      />
      <StatCard
        label="Temperature"
        value={`${String(gpu.temperature)}°C`}
        progress={gpu.temperature}
        color={getTemperatureColor(gpu.temperature)}
      />
      <StatCard label="Power Draw" value={`${String(gpu.powerDraw)} W`} />
    </Box>
  );
};
