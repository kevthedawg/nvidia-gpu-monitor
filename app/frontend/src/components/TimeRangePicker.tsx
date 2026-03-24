import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

const PRESETS = [
  { label: "1m", ms: 60 * 1000 },
  { label: "5m", ms: 5 * 60 * 1000 },
  { label: "15m", ms: 15 * 60 * 1000 },
  { label: "30m", ms: 30 * 60 * 1000 },
  { label: "1h", ms: 60 * 60 * 1000 },
  { label: "3h", ms: 3 * 60 * 60 * 1000 },
  { label: "6h", ms: 6 * 60 * 60 * 1000 },
  { label: "12h", ms: 12 * 60 * 60 * 1000 },
  { label: "24h", ms: 24 * 60 * 60 * 1000 },
];

interface TimeRangePickerProps {
  from: number;
  to: number;
  pinToNow: boolean;
  activePreset: string | null;
  onChange: (from: number, to: number) => void;
  onPresetSelect: (label: string, ms: number) => void;
  onPinToNowChange: (pinned: boolean) => void;
}

export const TimeRangePicker = ({
  from,
  to,
  pinToNow,
  activePreset,
  onChange,
  onPresetSelect,
  onPinToNowChange,
}: TimeRangePickerProps): React.ReactElement => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 0.75,
    }}
  >
    {PRESETS.map((p) => (
      <Chip
        key={p.label}
        label={p.label}
        size="small"
        variant={activePreset === p.label ? "filled" : "outlined"}
        color={activePreset === p.label ? "primary" : "default"}
        onClick={() => {
          onPresetSelect(p.label, p.ms);
        }}
      />
    ))}
    <Box sx={{ mx: 0.5, opacity: 0.3 }}>{"│"}</Box>
    <DateTimePicker
      label="From"
      value={dayjs(from)}
      onChange={(val: Dayjs | null) => {
        if (val?.isValid()) {
          onChange(val.valueOf(), to);
        }
      }}
      maxDateTime={dayjs(to)}
      slotProps={{ textField: { size: "small", sx: { width: 200 } } }}
    />
    <Typography variant="caption" sx={{ opacity: 0.4 }}>
      {"—"}
    </Typography>
    {pinToNow ? (
      <Chip
        label="Current"
        color="primary"
        size="small"
        onDelete={() => {
          onPinToNowChange(false);
        }}
      />
    ) : (
      <>
        <DateTimePicker
          label="To"
          value={dayjs(to)}
          onChange={(val: Dayjs | null) => {
            if (val?.isValid()) {
              onChange(from, val.valueOf());
            }
          }}
          minDateTime={dayjs(from)}
          slotProps={{ textField: { size: "small", sx: { width: 200 } } }}
        />
        <Chip
          label="Current"
          variant="outlined"
          size="small"
          onClick={() => {
            onPinToNowChange(true);
          }}
        />
      </>
    )}
  </Box>
);
