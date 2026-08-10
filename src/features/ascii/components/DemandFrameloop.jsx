import * as React from "react";
import { useThree } from "@react-three/fiber"; // TODO: source not present — original hO

/**
 * When frameloop is "demand", schedules a single invalidate via requestIdleCallback
 * (or setTimeout fallback) so the first frame is drawn.
 * original: fE
 */
function selectInvalidate(state) {
  return state.invalidate;
}

export function DemandFrameloop({ frameloop }) {
  const invalidate = useThree(selectInvalidate);
  const hasScheduled = React.useRef(false);

  React.useEffect(() => {
    if (frameloop !== "demand" || hasScheduled.current) return;
    hasScheduled.current = true;

    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => invalidate());
      return () => cancelIdleCallback(id);
    }

    const id = setTimeout(() => invalidate(), 0);
    return () => clearTimeout(id);
  }, [frameloop, invalidate]);

  return null;
}
