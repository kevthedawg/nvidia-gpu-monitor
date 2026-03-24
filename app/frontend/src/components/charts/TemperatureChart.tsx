import type uPlot from "uplot";

import type { ChartCardProps } from "./ChartCard";
import { ChartCard } from "./ChartCard";
import type { MetricRow } from "./helpers";
import { buildMetricData } from "./helpers";

const getZoneColor = (val: number): string => {
  if (val >= 85) return "#f44336";
  if (val >= 70) return "#ff9800";
  if (val >= 50) return "#ff9800";
  return "#76b900";
};

const ZONE_LINES = [
  { y: 50, color: "#76b900", label: "50°C" },
  { y: 70, color: "#ff9800", label: "70°C" },
  { y: 85, color: "#f44336", label: "85°C" },
];

// Build a horizontal gradient with color stops based on each data point's zone
const buildZoneGradient = (
  u: uPlot,
  seriesIdx: number,
  alpha: string,
): CanvasGradient => {
  const xData = u.data[0];
  const yData = u.data[seriesIdx];
  const grad = u.ctx.createLinearGradient(
    u.bbox.left,
    0,
    u.bbox.left + u.bbox.width,
    0,
  );

  let prevColor = "";
  for (let i = 0; i < xData.length; i++) {
    const val = yData[i];
    if (val === null || val === undefined) continue;
    const pct = (u.valToPos(xData[i], "x", true) - u.bbox.left) / u.bbox.width;
    const clamped = Math.max(0, Math.min(1, pct));
    const color = getZoneColor(val) + alpha;

    // Double-stop at transitions for a sharp edge
    if (prevColor && color !== prevColor) {
      grad.addColorStop(Math.max(0, clamped - 0.001), prevColor);
    }
    grad.addColorStop(clamped, color);
    prevColor = color;
  }

  return grad;
};

const tempZonesPlugin: uPlot.Plugin = {
  hooks: {
    draw: (u: uPlot) => {
      const { ctx } = u;
      for (const zone of ZONE_LINES) {
        const y = Math.round(u.valToPos(zone.y, "y", true));
        ctx.save();
        ctx.strokeStyle = zone.color;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(u.bbox.left, y);
        ctx.lineTo(u.bbox.left + u.bbox.width, y);
        ctx.stroke();
        ctx.fillStyle = zone.color;
        ctx.font = "11px sans-serif";
        ctx.fillText(zone.label, u.bbox.left + u.bbox.width - 30, y - 4);
        ctx.restore();
      }
    },
  },
};

export const TemperatureChart = ({
  data,
  gpuIndices,
  timestamps,
  syncKey,
  onRangeSelect,
}: {
  data: MetricRow[];
  gpuIndices: number[];
  timestamps?: number[];
  syncKey?: string;
  onRangeSelect?: ChartCardProps["onRangeSelect"];
}): React.ReactElement => {
  const { data: aligned, meta } = buildMetricData(
    data,
    "temperature",
    gpuIndices,
    "#ff9800",
    { timestamps },
  );

  // Override meta colors with gradient functions
  const gradientMeta = meta.map((m) => ({
    ...m,
    stroke: (u: uPlot, seriesIdx: number) =>
      buildZoneGradient(u, seriesIdx, ""),
    fill: (u: uPlot, seriesIdx: number) =>
      buildZoneGradient(u, seriesIdx, "26"),
  }));

  return (
    <ChartCard
      title="Temperature"
      unit="°C"
      data={aligned}
      meta={gradientMeta}
      plugins={[tempZonesPlugin]}
      syncKey={syncKey}
      onRangeSelect={onRangeSelect}
    />
  );
};
