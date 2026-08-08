import { useMemo } from 'react';
import { usePageTransitionContext } from '../PageTransitionProvider';

export function usePageTransition() {
  const {
    startTransition,
    phase,
    isPending
  } = usePageTransitionContext();

  const isTransitioning = phase !== "idle";

  const transitionState = useMemo(() => ({
    startTransition,
    isTransitioning,
    phase,
    isPending
  }), [isPending, phase, startTransition, isTransitioning]);

  return transitionState;
}

