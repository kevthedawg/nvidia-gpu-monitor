import { useRef } from "react";
import type uPlot from "uplot";

import { timeFormatter } from "./helpers";

// ── Color utilities ─────────────────────────

/**
 * Lighten a hex color by blending toward white.
 * amount: 0 = no change, 1 = fully white.
 */
export const lightenColor = (hex: string, amount: number): string => {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
};

/**
 * Resolve the display color for a series.
 * Tries series.stroke (string), then series.points.stroke (string),
 * then falls back to the provided seriesColors array.
 */
export const resolveSeriesColor = (
  s: uPlot.Series,
  seriesIdx: number,
  seriesColors: string[],
): string => {
  if (typeof s.stroke === "string") return s.stroke;
  const ps = s.points?.stroke;
  if (typeof ps === "string") return ps;
  return seriesColors[seriesIdx - 1] ?? "#fff";
};

// ── Tooltip plugin ──────────────────────────

const TOOLTIP_STYLE: Partial<CSSStyleDeclaration> = {
  position: "absolute",
  pointerEvents: "none",
  background: "rgba(30, 30, 30, 0.92)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "4px",
  padding: "6px 10px",
  fontSize: "12px",
  color: "rgba(255,255,255,0.85)",
  zIndex: "100",
  display: "none",
  whiteSpace: "nowrap",
};

export const useTooltipPlugin = (seriesColors: string[]): uPlot.Plugin => {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const isHoveredRef = useRef(false);

  return useRef<uPlot.Plugin>({
    hooks: {
      init: (u: uPlot) => {
        const el = document.createElement("div");
        Object.assign(el.style, TOOLTIP_STYLE);
        u.over.appendChild(el);
        tooltipRef.current = el;

        u.over.addEventListener("mouseenter", () => {
          isHoveredRef.current = true;
        });
        u.over.addEventListener("mouseleave", () => {
          isHoveredRef.current = false;
        });
      },
      setCursor: (u: uPlot) => {
        const tip = tooltipRef.current;
        if (!tip) return;

        const { idx, left } = u.cursor;
        if (idx === undefined || idx === null || left === undefined) {
          tip.style.display = "none";
          return;
        }

        const ts = u.data[0][idx];
        const time = timeFormatter.format(new Date(ts * 1000));
        let html = `<div style="margin-bottom:3px;opacity:0.6">${time}</div>`;

        for (let i = 1; i < u.series.length; i++) {
          const s = u.series[i];
          if (!s.show) continue;
          const val = u.data[i][idx];
          if (val === undefined || val === null) continue;
          const color = resolveSeriesColor(s, i, seriesColors);
          const label = typeof s.label === "string" ? s.label : "";
          const display = Number.isInteger(val) ? String(val) : val.toFixed(2);
          html += `<div><span style="color:${color}">\u25CF</span> ${label}: <b>${display}</b></div>`;
        }

        tip.innerHTML = html;
        tip.style.display = "block";

        const overW = u.over.offsetWidth;
        const overH = u.over.offsetHeight;
        const tipW = tip.offsetWidth;
        const tipH = tip.offsetHeight;

        const x = left + tipW + 20 > overW ? left - tipW - 10 : left + 10;

        const top = u.cursor.top;
        const y =
          isHoveredRef.current && top !== undefined
            ? top + tipH + 10 > overH
              ? top - tipH - 10
              : top + 10
            : (overH - tipH) / 2;

        tip.style.left = `${String(Math.max(0, x))}px`;
        tip.style.top = `${String(Math.max(0, y))}px`;
      },
    },
  }).current;
};

// ── Select (drag-to-zoom) plugin ────────────

export const useSelectPlugin = (
  onRangeSelectRef: React.RefObject<
    ((fromMs: number, toMs: number) => void) | undefined
  >,
): uPlot.Plugin =>
  useRef<uPlot.Plugin>({
    hooks: {
      setSelect: (u: uPlot) => {
        if (u.select.width > 0) {
          const min = u.posToVal(u.select.left, "x");
          const max = u.posToVal(u.select.left + u.select.width, "x");
          onRangeSelectRef.current?.(min * 1000, max * 1000);
          u.setSelect({ left: 0, top: 0, width: 0, height: 0 }, false);
        }
      },
    },
  }).current;
