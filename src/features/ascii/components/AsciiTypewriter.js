import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { clsx } from "clsx";
import { AsciiCanvas } from "./AsciiCanvas.js";
import { getImageContentBounds } from "../utils/image/getImageContentBounds.js";
import { easeOutCubic } from "../utils/easing.js";
import { ASCII_CHARACTERS } from "../constants/asciiCharacters.js";

// TODO: original module referenced ei.ASCII_ANIMATION_DURATION — value unknown, using 1000 ms fallback
const ASCII_ANIMATION_DURATION_MS = 1000;

/**
 * Top-level public component: ASCII typewriter reveal of an image with
 * optional click-to-replay radial color sweeps, hover gooey/parallax, and
 * reduced-motion support.
 */
export function AsciiTypewriter({
  imageSrc,
  className,
  color = "#ff6b4a",
  cellSize,
  delay = 100,
  duration = ASCII_ANIMATION_DURATION_MS,
  colorDelay = 150,
  onComplete,
  alignX = "center",
  alignY = "bottom",
  fit = "cover",
  mobileFit,
  enableHover = false,
  hoverMode = "stretch",
  hoverIntensity,
  mouseX = 0,
  mouseY = 0,
  mouseRef,
  revealEnd = 0.85,
  randomness = 0.3,
  linear = false,
  enableGooeyReveal = false,
  gooeyRadius = 0.06,
  gooeySoftness = 0.08,
  gooeyNoiseIntensity = 0.03,
  isHovering = false,
  enableDepthParallax = false,
  depthMapSrc,
  parallaxIntensity = 0.02,
  externalProgress,
  externalColorProgress,
  disableInternalAnimation = false,
  colorDark,
  depthDetailMin,
  revealOrigin = { x: 0.5, y: 0.5 },
  frameloop,
  debugLabel,
  dpr,
  skipContentBounds = false,
}) {
  const effectRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [colorProgress, setColorProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [contentBoundsScale, setContentBoundsScale] = useState(1);
  const [clickColorProgress, setClickColorProgress] = useState(null);
  const [clickPoint, setClickPoint] = useState(null);
  const [clickRadialInvert, setClickRadialInvert] = useState(false);
  const [impactProgress, setImpactProgress] = useState(0);

  const animationCompleteRef = useRef(false);
  const clickAnimFrameRef = useRef(null);
  const impactAnimFrameRef = useRef(null);
  const isInvertedRef = useRef(false);
  const clickStartTimeRef = useRef(0);
  const revealOriginRef = useRef(revealOrigin);
  revealOriginRef.current = revealOrigin;

  const containerRef = useRef(null);
  const isInViewRef = useRef(false);

  // Compute content bounds so the typewriter finishes when real content is covered
  useEffect(() => {
    if (skipContentBounds) return;
    getImageContentBounds(imageSrc, revealOrigin).then((scale) => {
      setContentBoundsScale(scale);
    });
  }, [imageSrc, revealOrigin.x, revealOrigin.y, revealOrigin, skipContentBounds]);

  // Reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const useExternal = disableInternalAnimation && externalProgress !== undefined;

  // Internal typewriter animation
  useEffect(() => {
    if (disableInternalAnimation) {
      animationCompleteRef.current = true;
      return;
    }
    if (prefersReducedMotion) {
      setProgress(1);
      setColorProgress(1);
      animationCompleteRef.current = true;
      onComplete?.();
      return;
    }

    const start = performance.now();
    let rafId;

    const tick = (now) => {
      const elapsed = now - start - delay;
      if (elapsed < 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(elapsed / duration, 1);
      setProgress(linear ? t : easeOutCubic(t));

      const colorElapsed = elapsed - colorDelay;
      if (colorElapsed > 0) {
        const ct = Math.min(colorElapsed / duration, 1);
        setColorProgress(linear ? ct : easeOutCubic(ct));
      }

      const colorDone = colorElapsed >= duration;
      if (t < 1 || !colorDone) {
        rafId = requestAnimationFrame(tick);
      } else {
        animationCompleteRef.current = true;
        onComplete?.();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [delay, duration, colorDelay, linear, prefersReducedMotion, onComplete, disableInternalAnimation]);

  // Click / keyboard replay of the color sweep
  const triggerClickReplay = useRef(() => {});
  triggerClickReplay.current = (point, delayMs = 0) => {
    if (!animationCompleteRef.current || clickAnimFrameRef.current !== null) return;

    const invert = !isInvertedRef.current;
    isInvertedRef.current = invert;
    const startTime = performance.now();
    clickStartTimeRef.current = startTime;
    setClickPoint(point);
    if (point) setClickRadialInvert(invert);

    if (prefersReducedMotion) {
      setClickColorProgress(+!invert);
      setClickPoint(null);
      setClickRadialInvert(false);
      return;
    }

    const run = () => {
      const from = +!!invert;
      const to = +!invert;
      const animate = (now) => {
        const t = Math.min((now - startTime) / ASCII_ANIMATION_DURATION_MS, 1);
        setClickColorProgress(from + (to - from) * easeOutCubic(t));
        if (t < 1) {
          clickAnimFrameRef.current = requestAnimationFrame(animate);
        } else {
          clickAnimFrameRef.current = null;
          if (clickStartTimeRef.current === startTime) {
            setClickPoint(null);
            setClickRadialInvert(false);
          }
        }
      };
      clickAnimFrameRef.current = requestAnimationFrame(animate);
    };

    if (delayMs > 0) {
      setTimeout(run, delayMs);
    } else {
      run();
    }
  };

  const triggerImpact = useRef(() => {});
  triggerImpact.current = () => {
    if (prefersReducedMotion) return;
    if (impactAnimFrameRef.current !== null) {
      cancelAnimationFrame(impactAnimFrameRef.current);
    }
    setImpactProgress(0);
    const start = performance.now();
    const animate = (now) => {
      const t = Math.min((now - start) / 500, 1);
      setImpactProgress(Math.sin((t * Math.PI) / 2));
      if (t < 1) {
        impactAnimFrameRef.current = requestAnimationFrame(animate);
      } else {
        impactAnimFrameRef.current = null;
      }
    };
    impactAnimFrameRef.current = requestAnimationFrame(animate);
  };

  // Keyboard "c" to replay from reveal origin (when in view)
  useEffect(() => {
    const onKey = (e) => {
      if (
        (e.key !== "c" && e.key !== "C") ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      ) {
        return;
      }
      const tag = e.target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        e.target?.isContentEditable
      ) {
        return;
      }
      if (isInViewRef.current) {
        clickStartTimeRef.current = performance.now();
        setClickPoint(revealOriginRef.current);
        triggerImpact.current();
        triggerClickReplay.current(revealOriginRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Cleanup animation frames
  useEffect(
    () => () => {
      if (clickAnimFrameRef.current !== null) {
        cancelAnimationFrame(clickAnimFrameRef.current);
        clickAnimFrameRef.current = null;
      }
      if (impactAnimFrameRef.current !== null) {
        cancelAnimationFrame(impactAnimFrameRef.current);
        impactAnimFrameRef.current = null;
      }
    },
    []
  );

  // Track visibility for keyboard shortcut
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) isInViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const onClick = useCallback((e) => {
    if (!animationCompleteRef.current || clickAnimFrameRef.current !== null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    clickStartTimeRef.current = performance.now();
    setClickPoint({ x, y });
    triggerImpact.current();
    triggerClickReplay.current({ x, y });
  }, []);

  const effectiveColorProgress =
    clickColorProgress !== null
      ? clickColorProgress
      : prefersReducedMotion
        ? 1
        : useExternal
          ? (externalColorProgress ?? externalProgress)
          : colorProgress;

  const finalProgress =
    (prefersReducedMotion
      ? 1
      : useExternal
        ? externalProgress
        : progress) * contentBoundsScale;

  const finalColorProgress = effectiveColorProgress * contentBoundsScale;

  return React.createElement(
    "div",
    {
      ref: containerRef,
      onClick,
      className: "size-full cursor-pointer",
    },
    React.createElement(AsciiCanvas, {
      imageSrc,
      className: clsx("size-full", className),
      color,
      ...(cellSize !== undefined ? { cellSize } : {}),
      progress: finalProgress,
      colorProgress: finalColorProgress,
      randomness,
      revealDirection: alignX === "right" ? -1 : 1,
      revealEnd,
      effectRef,
      alignX,
      alignY,
      fit,
      mobileFit,
      enableHover,
      hoverMode,
      hoverIntensity,
      mouseX,
      mouseY,
      mouseRef,
      enableGooeyReveal,
      gooeyRadius,
      gooeySoftness,
      gooeyNoiseIntensity,
      isHovering,
      enableDepthParallax,
      depthMapSrc,
      parallaxIntensity,
      clickPoint,
      clickRadialInvert,
      impactProgress,
      revealOrigin,
      ...(colorDark !== undefined ? { colorDark } : {}),
      ...(depthDetailMin !== undefined ? { depthDetailMin } : {}),
      ...(frameloop !== undefined ? { frameloop } : {}),
      ...(debugLabel !== undefined ? { debugLabel } : {}),
      ...(dpr !== undefined ? { dpr } : {}),
    })
  );
}

// Re-export for convenience (original module ID 271913)
export default AsciiTypewriter;
