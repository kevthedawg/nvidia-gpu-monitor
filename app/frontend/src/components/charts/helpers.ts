export interface MetricRow {
  timestamp: number;
  gpuIndex: number;
  gpuUtil: number;
  memUsed: number;
  temperature: number;
  powerDraw: number;
}

export interface ProcessRow {
  timestamp: number;
  gpuIndex: number;
  pid: number;
  processName: string;
  usedMemory: number;
}

export interface SeriesItem {
  data: (number | null)[];
  label: string;
  color: string;
  area: boolean;
  showMark: boolean;
  stack?: string;
}

export const MB_PER_GB = 1024;

export const PROCESS_COLORS = [
  "#2196f3",
  "#4caf50",
  "#ff9800",
  "#e91e63",
  "#9c27b0",
];

export const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

type NumericKey = "gpuUtil" | "memUsed" | "temperature" | "powerDraw";

export const buildSeries = (
  data: MetricRow[],
  key: NumericKey,
  timestamps: number[],
  gpuIndices: number[],
  color: string,
  transform?: (v: number) => number,
): SeriesItem[] => {
  const fn = transform ?? ((v: number): number => v);
  return gpuIndices.map((idx) => {
    const gpuData = data.filter((d) => d.gpuIndex === idx);
    const dataMap = new Map(gpuData.map((d) => [d.timestamp, fn(d[key])]));
    return {
      data: timestamps.map((t) => dataMap.get(t) ?? null),
      label: gpuIndices.length > 1 ? `GPU ${String(idx)}` : key,
      showMark: false,
      color,
      area: true,
    };
  });
};

export const buildVramSeries = (
  processData: ProcessRow[],
  timestamps: number[],
): SeriesItem[] => {
  const processKeys = [
    ...new Set(processData.map((p) => `${String(p.pid)}-${p.processName}`)),
  ];

  return processKeys.map((key, i) => {
    const [pidStr] = key.split("-");
    const pid = Number(pidStr);
    const name = key.slice(pidStr.length + 1);
    const byTimestamp = new Map<number, number>();

    for (const p of processData) {
      if (p.pid === pid && p.processName === name) {
        byTimestamp.set(p.timestamp, p.usedMemory / MB_PER_GB);
      }
    }

    return {
      data: timestamps.map((t) => byTimestamp.get(t) ?? null),
      label: `${name} (${String(pid)})`,
      showMark: false,
      color: PROCESS_COLORS[i % PROCESS_COLORS.length],
      area: true,
      stack: "vram",
    };
  });
};
