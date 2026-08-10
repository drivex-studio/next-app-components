import { useBreakpoint } from ".@/shared/hooks/useIsTouchDevice";
import { ASCII_REVEAL_DURATION } from "../constants/asciiConfig";

const asciiDelayBase = 0.1 * ASCII_REVEAL_DURATION;

export function useAsciiDelay() {
  const md = useBreakpoint("md");
  return md ? asciiDelayBase : 0;
}
