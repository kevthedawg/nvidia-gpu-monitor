import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import type { AxisItemIdentifier } from "@mui/x-charts/models";

import type { SeriesItem } from "./helpers";
import { timeFormatter } from "./helpers";

const AREA_STYLE = { "& .MuiAreaElement-root": { opacity: 0.15 } };
const CHART_MARGIN = { left: 50, right: 20, top: 20, bottom: 30 };

export interface SharedChartProps {
  timestamps: number[];
  highlightedAxis: AxisItemIdentifier[];
  onHighlightedAxisChange: (axis: AxisItemIdentifier[]) => void;
}

export const ChartCard = ({
  title,
  unit,
  series,
  timestamps,
  highlightedAxis,
  onHighlightedAxisChange,
  children,
}: SharedChartProps & {
  title: string;
  unit: string;
  series: SeriesItem[];
  children?: React.ReactNode;
}): React.ReactElement => (
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
            id: "time",
            scaleType: "time",
            data: timestamps.map((t) => new Date(t)),
            valueFormatter: (v: Date) => timeFormatter.format(v),
          },
        ]}
        sx={AREA_STYLE}
        margin={CHART_MARGIN}
        highlightedAxis={highlightedAxis}
        onHighlightedAxisChange={onHighlightedAxisChange}
      >
        {children}
      </LineChart>
    </CardContent>
  </Card>
);
