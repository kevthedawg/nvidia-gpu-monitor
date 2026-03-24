import "uplot/dist/uPlot.min.css";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { useCallback, useMemo, useRef, useState } from "react";
import uPlot from "uplot";
import UplotReact from "uplot-react";

import { useResizeObserver } from "../../lib/hooks/useResizeObserver";
import type { SeriesMeta } from "./helpers";
import { lightenColor, useSelectPlugin, useTooltipPlugin } from "./plugins";

// ── Styling ────────────────────────────────────

const SELECT_STYLE = `
  .u-select { background: rgba(255, 255, 255, 0.08) !important; }
`;

const AXIS_STROKE = "rgba(255, 255, 255, 0.5)";
const GRID_STROKE = "rgba(255, 255, 255, 0.06)";

// ── Bucket averaging ───────────────────────────
// Divides data into `target` equal time buckets and averages each one.

const downsample = (
  data: uPlot.AlignedData,
  target: number,
): uPlot.AlignedData => {
  const len = data[0].length;
  if (len <= target || target < 2) return data;

  const seriesCount = data.length - 1;
  const bucketSize = len / target;

  const ts: number[] = [];
  const series: (number | null)[][] = Array.from(
    { length: seriesCount },
    () => [],
  );

  for (let b = 0; b < target; b++) {
    const start = Math.floor(b * bucketSize);
    const end = Math.min(Math.floor((b + 1) * bucketSize), len);

    // Timestamp: midpoint of the bucket
    ts.push((data[0][start] + data[0][end - 1]) / 2);

    // Each series: average of non-null values in the bucket
    for (let s = 0; s < seriesCount; s++) {
      const arr = data[s + 1];
      let sum = 0;
      let count = 0;
      for (let j = start; j < end; j++) {
        const v = arr[j];
        if (v !== null && v !== undefined) {
          sum += v;
          count++;
        }
      }
      series[s].push(count > 0 ? sum / count : null);
    }
  }

  return [ts, ...series];
};

// ── Static legend ──────────────────────────────

const StaticLegend = ({ meta }: { meta: SeriesMeta[] }): React.ReactElement => (
  <Box
    sx={{
      display: "flex",
      gap: 2,
      flexWrap: "wrap",
      mt: 1,
      justifyContent: "center",
    }}
  >
    {meta.map((m) => (
      <Box
        key={m.label}
        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
      >
        <Box
          sx={{
            width: 16,
            height: 2,
            backgroundColor: m.color,
            borderRadius: 1,
          }}
        />
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {m.label}
        </Typography>
      </Box>
    ))}
  </Box>
);

// ── Component ──────────────────────────────────

export interface ChartCardProps {
  title: string;
  unit: string;
  data: uPlot.AlignedData;
  meta: SeriesMeta[];
  scales?: uPlot.Scales;
  plugins?: uPlot.Plugin[];
  syncKey?: string;
  showLegend?: boolean;
  onRangeSelect?: (fromMs: number, toMs: number) => void;
}

export const ChartCard = ({
  title,
  unit,
  data,
  meta,
  scales,
  plugins: extraPlugins,
  syncKey,
  showLegend = false,
  onRangeSelect,
}: ChartCardProps): React.ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 400, height: 200 });
  const onRangeSelectRef = useRef(onRangeSelect);
  onRangeSelectRef.current = onRangeSelect;

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    const { width, height } = entries[0].contentRect;
    if (width > 0 && height > 0) {
      setSize({ width, height });
    }
  }, []);
  useResizeObserver(containerRef, handleResize);

  const colorKey = meta.map((m) => m.color).join(",");
  const seriesColors = useMemo(() => meta.map((m) => m.color), [colorKey]); // eslint-disable-line react-hooks/exhaustive-deps -- stable by color values
  const colorFromValueFns = useRef(meta.map((m) => m.colorFromValue));
  colorFromValueFns.current = meta.map((m) => m.colorFromValue);
  const tooltipPlugin = useTooltipPlugin(seriesColors, colorFromValueFns);
  const selectPlugin = useSelectPlugin(onRangeSelectRef);

  const options = useMemo((): uPlot.Options => {
    const allPlugins = [tooltipPlugin, selectPlugin, ...(extraPlugins ?? [])];

    return {
      width: size.width,
      height: size.height,
      series: [
        {},
        ...meta.map(
          (m): uPlot.Series => ({
            label: m.label,
            stroke: m.stroke ?? m.color,
            fill: m.fill,
            width: 1.5,
            paths: uPlot.paths.spline?.() ?? undefined,
            points: {
              fill: m.stroke ?? m.color,
              stroke: m.stroke ?? m.color,
            },
          }),
        ),
      ],
      scales,
      axes: [
        {
          stroke: AXIS_STROKE,
          grid: { stroke: GRID_STROKE },
          ticks: { stroke: GRID_STROKE },
        },
        {
          stroke: AXIS_STROKE,
          grid: { stroke: GRID_STROKE },
          ticks: { stroke: GRID_STROKE },
        },
      ],
      legend: { show: false },
      cursor: {
        drag: { x: true, y: false, setScale: false },
        sync: syncKey ? { key: syncKey, setSeries: true } : undefined,
        points: {
          fill: (u: uPlot, sIdx: number) => {
            const fn = colorFromValueFns.current[sIdx - 1];
            if (fn && u.cursor.idx !== null && u.cursor.idx !== undefined) {
              const val = u.data[sIdx][u.cursor.idx];
              if (val !== null && val !== undefined)
                return lightenColor(fn(val), 0.4);
            }
            return lightenColor(seriesColors[sIdx - 1] ?? "#fff", 0.4);
          },
          stroke: (u: uPlot, sIdx: number) => {
            const fn = colorFromValueFns.current[sIdx - 1];
            if (fn && u.cursor.idx !== null && u.cursor.idx !== undefined) {
              const val = u.data[sIdx][u.cursor.idx];
              if (val !== null && val !== undefined) return fn(val);
            }
            return seriesColors[sIdx - 1] ?? "#fff";
          },
          size: 8,
        },
      },
      plugins: allPlugins,
    };
  }, [
    size,
    meta,
    scales,
    syncKey,
    tooltipPlugin,
    selectPlugin,
    extraPlugins,
    seriesColors,
  ]);

  return (
    <Card sx={{ minHeight: 120, height: "30vh" }}>
      <CardContent
        sx={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Typography
          variant="subtitle2"
          sx={{ mb: 1, opacity: 0.6, textAlign: "center" }}
        >
          {title}
          {` (${unit})`}
        </Typography>
        <div
          ref={containerRef}
          style={{ height: "100%", width: "100%", position: "relative" }}
        >
          <style>{SELECT_STYLE}</style>
          <UplotReact options={options} data={downsample(data, size.width)} />
          {(data[0].length === 0 || meta.length === 0) && (
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: "40%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                opacity: 0.3,
              }}
            >
              {"No Data"}
            </Typography>
          )}
        </div>
        {showLegend && <StaticLegend meta={meta} />}
      </CardContent>
    </Card>
  );
};
