import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";

/**
 * When frameloop is "demand", force a single invalidate after mount via
 * requestIdleCallback (or setTimeout fallback) so the first frame is rendered.
 */
export function InvalidateOnDemand({ frameloop }) {
  const invalidate = useThree((state) => state.invalidate);
  const didRun = useRef(false);

  useEffect(() => {
    if (frameloop !== "demand" || didRun.current) return;
    didRun.current = true;

    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => invalidate());
      return () => cancelIdleCallback(id);
    }

    const id = setTimeout(() => invalidate(), 0);
    return () => clearTimeout(id);
  }, [frameloop, invalidate]);

  return null;
}
