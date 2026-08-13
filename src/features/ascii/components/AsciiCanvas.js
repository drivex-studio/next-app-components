import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { clsx } from "clsx";
import { useIsTouchDevice } from "../../../hooks/useIsTouchDevice.js"; // original webpack module ID: 537836
import { AsciiImage } from "./AsciiImage.js";
import { AsciiEffectRenderer } from "./AsciiEffectRenderer.js";
import { InvalidateOnDemand } from "./InvalidateOnDemand.js";
import { onCanvasCreated } from "../utils/webgl/context.js";
import { ASCII_CHARACTERS } from "../constants/asciiCharacters.js";

/**
 * Full-screen R3F canvas that hosts the image plane + ASCII effect stack.
 * Handles responsive cell size, intersection-based frameloop pausing, and DPR.
 */
export function AsciiCanvas({
  imageSrc,
  className,
  characters = ASCII_CHARACTERS,
  fontSize = 54,
  cellSize = 20,
  color = "#ff6b4a",
  invert = false,
  progress = 1,
  colorProgress = 1,
  randomness = 0.3,
  revealDirection = 1,
  revealEnd = 0.85,
  effectRef,
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
  enableGooeyReveal = false,
  gooeyRadius = 0.15,
  gooeySoftness = 0.08,
  gooeyNoiseIntensity = 0.03,
  isHovering = false,
  enableDepthParallax = false,
  depthMapSrc,
  parallaxIntensity = 0.02,
  colorDark,
  depthDetailMin,
  clickPoint,
  clickRadialInvert,
  impactProgress,
  revealOrigin = { x: 0.5, y: 0.5 },
  frameloop = "always",
  dpr = [1, 1.5],
}) {
  const containerRef = useRef(null);
  const [resolvedCellSize, setResolvedCellSize] = useState(cellSize);
  const [isVisible, setIsVisible] = useState(true);

  const isTouch = useIsTouchDevice();
  const effectiveFit = isTouch && mobileFit ? mobileFit : fit;
  const effectiveHoverIntensity =
    hoverIntensity ?? (hoverMode === "headTurn" ? 0.04 : 0.15);

  // Pause rendering when off-screen (only when frameloop === "always")
  useEffect(() => {
    if (frameloop !== "always") return;
    const el = containerRef.current;
    if (!el) return;

    let timeoutId = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          if (entry.isIntersecting) {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            setIsVisible(true);
          } else {
            timeoutId = setTimeout(() => setIsVisible(false), 500);
          }
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [frameloop]);

  // Responsive cell size based on container + DPR
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const size = Math.max(el.clientWidth, el.clientHeight);
      if (!Number.isFinite(size) || size <= 0) return;
      const dprValue = Math.max(
        dpr[0],
        Math.min(window.devicePixelRatio ?? 1, dpr[1])
      );
      const next =
        cellSize *
        Math.max(0.5, size / 1920) *
        1.35 *
        (dprValue / 2);
      if (Number.isFinite(next) && next > 0) {
        setResolvedCellSize(next);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cellSize, dpr]);

  const effectiveFrameloop =
    frameloop !== "always" || isVisible ? frameloop : "never";

  const glConfig = useMemo(
    () => ({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    }),
    []
  );

  const cameraConfig = useMemo(
    () => ({
      position: [0, 0, 5],
      fov: 50,
    }),
    []
  );

  const style = useMemo(() => ({ background: "transparent" }), []);

  const cellSizeForEffect = Math.max(1, 1.6 * resolvedCellSize);

  return React.createElement(
    "div",
    {
      ref: containerRef,
      className: clsx("relative size-full", className),
    },
    React.createElement(
      Canvas,
      {
        frameloop: effectiveFrameloop,
        className: "opacity-100",
        dpr,
        gl: glConfig,
        camera: cameraConfig,
        style,
        onCreated: onCanvasCreated,
      },
      React.createElement(InvalidateOnDemand, { frameloop }),
      React.createElement(AsciiImage, {
        imageSrc,
        alignX,
        alignY,
        fit: effectiveFit,
        enableHover,
        hoverMode,
        hoverIntensity: effectiveHoverIntensity,
        mouseX,
        mouseY,
        isHovering,
      }),
      React.createElement(AsciiEffectRenderer, {
        characters,
        fontSize,
        cellSize: cellSizeForEffect,
        color,
        invert,
        respectAlpha: true,
        alphaThreshold: 0.1,
        progress,
        colorProgress,
        randomness,
        revealDirection,
        revealEnd,
        effectRef,
        enableGooeyReveal,
        gooeyRadius,
        gooeySoftness,
        gooeyNoiseIntensity,
        mouseX,
        mouseY,
        mouseRef,
        isHovering,
        enableDepthParallax,
        depthMapSrc,
        parallaxIntensity,
        colorDark,
        depthDetailMin,
        clickPoint,
        clickRadialInvert,
        impactProgress,
        revealOrigin,
      })
    )
  );
}
