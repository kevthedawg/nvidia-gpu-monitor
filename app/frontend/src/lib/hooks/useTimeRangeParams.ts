import { useCallback, useState } from "react";

const PRESET_MS: Record<string, number> = {
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "3h": 3 * 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
};

const DEFAULT_PRESET = "15m";

const syncUrl = (fromParam: string, toParam: string): void => {
  const url = new URL(window.location.href);
  url.searchParams.set("from", fromParam);
  url.searchParams.set("to", toParam);
  window.history.replaceState(null, "", url.toString());
};

const parseInitial = (): {
  from: number;
  to: number;
  pinToNow: boolean;
  activePreset: string | null;
} => {
  const params = new URLSearchParams(window.location.search);
  const rawFrom = params.get("from");
  const rawTo = params.get("to");

  // Default: 15m preset, pinned to now
  if (!rawFrom || !rawTo) {
    const now = Date.now();
    return {
      from: now - PRESET_MS[DEFAULT_PRESET],
      to: now,
      pinToNow: true,
      activePreset: DEFAULT_PRESET,
    };
  }

  const pinToNow = rawTo === "current";
  const now = Date.now();

  // Parse "to"
  const to = pinToNow ? now : Number(rawTo);
  if (!pinToNow && !Number.isFinite(to)) {
    return {
      from: now - PRESET_MS[DEFAULT_PRESET],
      to: now,
      pinToNow: true,
      activePreset: DEFAULT_PRESET,
    };
  }

  // Parse "from" — preset label or ms timestamp
  if (Object.hasOwn(PRESET_MS, rawFrom)) {
    const presetMs = PRESET_MS[rawFrom];
    return {
      from: (pinToNow ? now : to) - presetMs,
      to,
      pinToNow,
      activePreset: rawFrom,
    };
  }

  const fromMs = Number(rawFrom);
  if (!Number.isFinite(fromMs)) {
    return {
      from: now - PRESET_MS[DEFAULT_PRESET],
      to: now,
      pinToNow: true,
      activePreset: DEFAULT_PRESET,
    };
  }

  return { from: fromMs, to, pinToNow, activePreset: null };
};

interface TimeRangeState {
  from: number;
  to: number;
  pinToNow: boolean;
  activePreset: string | null;
  setPreset: (label: string, ms: number) => void;
  setRange: (from: number, to: number) => void;
  setPinToNow: (pinned: boolean) => void;
  setTo: (now: number) => void;
}

export const useTimeRangeParams = (): TimeRangeState => {
  const [state, setState] = useState(parseInitial);

  const setPreset = useCallback((label: string, ms: number) => {
    const now = Date.now();
    setState({ from: now - ms, to: now, pinToNow: true, activePreset: label });
    syncUrl(label, "current");
  }, []);

  const setRange = useCallback((from: number, to: number) => {
    const f = Math.round(from);
    const t = Math.round(to);
    setState({ from: f, to: t, pinToNow: false, activePreset: null });
    syncUrl(String(f), String(t));
  }, []);

  const setPinToNow = useCallback((pinned: boolean) => {
    if (pinned) {
      const now = Date.now();
      const ms = PRESET_MS[DEFAULT_PRESET];
      setState({
        from: now - ms,
        to: now,
        pinToNow: true,
        activePreset: DEFAULT_PRESET,
      });
      syncUrl(DEFAULT_PRESET, "current");
    } else {
      setState((prev) => ({ ...prev, pinToNow: false }));
    }
  }, []);

  // Update `to` for the 5s poll — no URL sync needed
  const setTo = useCallback((now: number) => {
    setState((prev) => ({ ...prev, to: now }));
  }, []);

  return { ...state, setPreset, setRange, setPinToNow, setTo };
};
