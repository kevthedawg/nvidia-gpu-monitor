import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";

interface GpuStats {
  gpuUtil: number;
  memUsed: number;
  memTotal: number;
  temperature: number;
  powerDraw: number;
}

const formatMemory = (mb: number): string =>
  mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${String(mb)}MB`;

const tempColor = (t: number): string =>
  t >= 85 ? "#f44336" : t >= 70 ? "#ff9800" : "#76b900";

const utilColor = (u: number): string =>
  u >= 90 ? "#f44336" : u >= 70 ? "#ff9800" : "#76b900";

const Stat = ({
  label,
  value,
  color = "#76b900",
  progress,
}: {
  label: string;
  value: string;
  color?: string;
  progress?: number;
}): React.ReactElement => (
  <Box sx={{ flex: 1, minWidth: 100 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
      <Typography variant="caption" sx={{ opacity: 0.5, fontSize: 11 }}>
        {label}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color, fontWeight: 600, fontSize: 11 }}
      >
        {value}
      </Typography>
    </Box>
    {progress !== undefined && (
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 3,
          borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.06)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: color,
            borderRadius: 2,
          },
        }}
      />
    )}
  </Box>
);

export const StatsCards = ({ gpu }: { gpu: GpuStats }): React.ReactElement => {
  const memPct = Math.round((gpu.memUsed / gpu.memTotal) * 100);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 3,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        backgroundColor: "rgba(255,255,255,0.03)",
      }}
    >
      <Stat
        label="GPU"
        value={`${String(gpu.gpuUtil)}%`}
        progress={gpu.gpuUtil}
        color={utilColor(gpu.gpuUtil)}
      />
      <Stat
        label="VRAM"
        value={`${formatMemory(gpu.memUsed)} / ${formatMemory(gpu.memTotal)}`}
        progress={memPct}
        color={utilColor(memPct)}
      />
      <Stat
        label="Temp"
        value={`${String(gpu.temperature)}°C`}
        progress={gpu.temperature}
        color={tempColor(gpu.temperature)}
      />
      <Stat label="Power" value={`${String(gpu.powerDraw)}W`} />
    </Box>
  );
};
