import { useLayoutEffect } from "react";

export const useResizeObserver = <T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  callback: ResizeObserverCallback,
  triggers?: React.RefObject<HTMLElement | null>[],
): void => {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const ro = new ResizeObserver(callback);
    ro.observe(el);
    if (triggers) {
      for (const trigger of triggers) {
        if (trigger.current) {
          ro.observe(trigger.current);
        }
      }
    }

    return () => {
      ro.disconnect();
    };
  }, [ref, callback, triggers]);
};
