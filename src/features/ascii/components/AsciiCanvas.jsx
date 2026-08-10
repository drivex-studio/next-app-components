import * as React from "react";
import { Canvas } from "@react-three/fiber"; // TODO: source not present — original db
import { clsx as cx } from "clsx"; // TODO: source not present — original en.cx; inferred as clsx
import { useIsTouchDevice } from "../hooks/useIsTouchDevice.js"; // TODO: source not present — original fo.useIsTouchDevice (module 537836)
import { DEFAULT_CHARACTERS } from "../effects/ASCIIEffect.js";
import { HoverImage } from "./HoverImage.jsx";
import { AsciiEffectComponent } from "./AsciiEffect.jsx";
import { DemandFrameloop } from "./DemandFrameloop.jsx";

/**
 * Full R3F Canvas hosting the image mesh + ASCII post-processing effect.
 * Handles responsive cell size, visibility-based frameloop, and DPR.
 * original: fC
 */
export function AsciiCanvas({
  imageSrc,
  className,
  characters,
  fontSize,
  cellSize,
  color,
  invert,
  progress,
  colorProgress,
  randomness,
  revealDirection,
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
  colorDark,
  depthDetailMin,
  clickPoint,
  clickRadialInvert,
  impactProgress,
  revealOrigin,
  frameloop,
  dpr,
}) {
  const chars = characters ?? DEFAULT_CHARACTERS;
  const fs = fontSize ?? 54;
  const cs = cellSize ?? 20;
  const col = color ?? "#ff6b4a";
  const inv = invert ?? false;
  const prog = progress ?? 1;
  const colorProg = colorProgress ?? 1;
  const rand = randomness ?? 0.3;
  const revealDir = revealDirection ?? 1;
  const revealEndVal = revealEnd ?? 0.85;
  const ax = alignX ?? "center";
  const ay = alignY ?? "bottom";
  const hoverEnabled = enableHover ?? false;
  const hMode = hoverMode ?? "stretch";
  const mx = mouseX ?? 0;
  const my = mouseY ?? 0;
  const gooeyEnabled = enableGooeyReveal ?? false;
  const gRadius = gooeyRadius ?? 0.15;
  const gSoft = gooeySoftness ?? 0.08;
  const gNoise = gooeyNoiseIntensity ?? 0.03;
  const hovering = isHovering ?? false;
  const depthEnabled = enableDepthParallax ?? false;
  const pIntensity = parallaxIntensity ?? 0.02;

  const origin = revealOrigin ?? { x: 0.5, y: 0.5 };
  const frameLoop = frameloop ?? "always";
  const devicePixelRatio = dpr ?? [1, 1.5];

  const intensity =
    hoverIntensity ?? (hMode === "headTurn" ? 0.04 : 0.15);

  const effectiveFit =
    useIsTouchDevice() && mobileFit
      ? mobileFit
      : fit ?? "cover";

  const containerRef = React.useRef(null);
  const [computedCellSize, setComputedCellSize] = React.useState(cs);
  const [isVisible, setIsVisible] = React.useState(true);

  // Pause rendering when off-screen (only when frameloop === "always")
  React.useEffect(() => {
    if (frameLoop !== "always") return;
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
  }, [frameLoop]);

  // Responsive cell size based on container dimensions + DPR
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const size = Math.max(el.clientWidth, el.clientHeight);
      if (!Number.isFinite(size) || size <= 0) return;
      const dprFactor =
        Math.max(
          devicePixelRatio[0],
          Math.min(window.devicePixelRatio ?? 1, devicePixelRatio[1])
        ) / 2;
      const next =
        cs * Math.max(0.5, size / 1920) * 1.35 * dprFactor;
      if (Number.isFinite(next) && next > 0) {
        setComputedCellSize(next);
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cs, devicePixelRatio]);

  const effectiveFrameloop =
    frameLoop !== "always" || isVisible ? frameLoop : "never";

  const containerClass = cx("relative size-full", className);

  const glConfig = {
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  };
  const cameraConfig = {
    position: [0, 0, 5],
    fov: 50,
  };
  const styleConfig = {
    background: "transparent",
  };

  const scaledCellSize = Math.max(1, 1.6 * computedCellSize);

  return (
    <div ref={containerRef} className={containerClass}>
      <Canvas
        frameloop={effectiveFrameloop}
        className="opacity-100"
        dpr={devicePixelRatio}
        gl={glConfig}
        camera={cameraConfig}
        style={styleConfig}
        onCreated={onCanvasCreated}
      >
        <DemandFrameloop frameloop={frameLoop} />
        <HoverImage
          imageSrc={imageSrc}
          alignX={ax}
          alignY={ay}
          fit={effectiveFit}
          enableHover={hoverEnabled}
          hoverMode={hMode}
          hoverIntensity={intensity}
          mouseX={mx}
          mouseY={my}
          isHovering={hovering}
        />
        <AsciiEffectComponent
          characters={chars}
          fontSize={fs}
          cellSize={scaledCellSize}
          color={col}
          invert={inv}
          respectAlpha={true}
          alphaThreshold={0.1}
          progress={prog}
          colorProgress={colorProg}
          randomness={rand}
          revealDirection={revealDir}
          revealEnd={revealEndVal}
          effectRef={effectRef}
          enableGooeyReveal={gooeyEnabled}
          gooeyRadius={gRadius}
          gooeySoftness={gSoft}
          gooeyNoiseIntensity={gNoise}
          mouseX={mx}
          mouseY={my}
          mouseRef={mouseRef}
          isHovering={hovering}
          enableDepthParallax={depthEnabled}
          depthMapSrc={depthMapSrc}
          parallaxIntensity={pIntensity}
          colorDark={colorDark}
          depthDetailMin={depthDetailMin}
          clickPoint={clickPoint}
          clickRadialInvert={clickRadialInvert}
          impactProgress={impactProgress}
          revealOrigin={origin}
        />
      </Canvas>
    </div>
  );
}

function onCanvasCreated({ gl }) {
  gl.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
  });
}
