import * as React from "react";
import { useFrame } from "@react-three/fiber"; // TODO: source not present — original hB
import { EffectComposer } from "@react-three/postprocessing"; // TODO: source not present — original fi (inferred from <fi multisampling={0}>)
import { TextureLoader } from "three"; // TODO: source not present — original sG
import { ASCIIEffect, DEFAULT_CHARACTERS } from "../effects/ASCIIEffect.js";
import { resolveImageSrc } from "../utils/resolveImageSrc.js";

/**
 * Creates and drives the ASCIIEffect instance, syncing uniforms from props
 * and handling depth-map loading + mouse/parallax/gooey updates each frame.
 * original: fw
 */
export function AsciiEffectComponent({
  characters = DEFAULT_CHARACTERS,
  fontSize = 54,
  cellSize = 20,
  color = "#ff6b4a",
  invert = false,
  alphaThreshold = 0.1,
  respectAlpha = true,
  progress = 1,
  colorProgress = 1,
  randomness = 0.3,
  revealDirection = 1,
  revealEnd = 0.85,
  enableGooeyReveal = false,
  gooeyRadius = 0.15,
  gooeySoftness = 0.08,
  gooeyNoiseIntensity = 0.03,
  enableDepthParallax = false,
  parallaxIntensity = 0.02,
  colorDark,
  depthDetailMin,
  effectRef,
  mouseX = -1,
  mouseY = -1,
  mouseRef,
  isHovering = false,
  depthMapSrc,
  clickPoint,
  clickRadialInvert,
  impactProgress,
  revealOrigin = { x: 0.5, y: 0.5 },
}) {
  const gooeyIntensityRef = React.useRef(0);
  const parallaxOffsetRef = React.useRef({ x: 0, y: 0 });
  const wasHoveringRef = React.useRef(false);
  const scrambleSeedRef = React.useRef(0);

  const effect = React.useMemo(
    () =>
      new ASCIIEffect({
        characters,
        fontSize,
        cellSize,
        color,
        invert,
        alphaThreshold,
        respectAlpha,
        progress,
        colorProgress,
        randomness,
        revealDirection,
        revealEnd,
        enableGooeyReveal,
        gooeyRadius,
        gooeySoftness,
        gooeyNoiseIntensity,
        enableDepthParallax,
        parallaxIntensity,
        colorDark,
        depthDetailMin,
        revealOrigin,
      }),
    [
      characters,
      fontSize,
      cellSize,
      color,
      invert,
      alphaThreshold,
      respectAlpha,
      randomness,
      revealDirection,
      revealEnd,
      enableGooeyReveal,
      gooeyRadius,
      gooeySoftness,
      gooeyNoiseIntensity,
      enableDepthParallax,
      parallaxIntensity,
      colorDark,
      depthDetailMin,
    ]
  );

  // Load depth map when enabled
  React.useEffect(() => {
    if (!depthMapSrc || !enableDepthParallax) return;
    const loader = new TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(resolveImageSrc(depthMapSrc), (tex) => {
      effect.setDepthMap(tex);
      effect.setEnableDepthParallax(true);
    });
  }, [depthMapSrc, enableDepthParallax, effect]);

  useFrame((state) => {
    const mx = mouseRef?.current?.x ?? mouseX;
    const my = mouseRef?.current?.y ?? mouseY;

    effect.setProgress(progress);
    effect.setColorProgress(colorProgress);
    effect.setClickPoint(clickPoint?.x ?? -1, clickPoint?.y ?? -1);
    effect.setRadialInvert(+!!clickRadialInvert);
    effect.setImpactProgress(impactProgress ?? 0);
    effect.setRevealOrigin(revealOrigin.x, revealOrigin.y);

    if (isHovering && (enableDepthParallax || enableGooeyReveal)) {
      state.invalidate();
    }

    // Parallax offset smoothing
    if (enableDepthParallax) {
      const targetX = isHovering ? -mx * parallaxIntensity : 0;
      const targetY = isHovering ? -my * parallaxIntensity * 0.5 : 0;
      const lerp = isHovering ? 0.08 : 0.05;
      parallaxOffsetRef.current.x +=
        (targetX - parallaxOffsetRef.current.x) * lerp;
      parallaxOffsetRef.current.y +=
        (targetY - parallaxOffsetRef.current.y) * lerp;
      effect.setParallaxOffset(
        parallaxOffsetRef.current.x,
        parallaxOffsetRef.current.y
      );

      if (!isHovering) {
        const dx = Math.abs(targetX - parallaxOffsetRef.current.x);
        const dy = Math.abs(targetY - parallaxOffsetRef.current.y);
        if (dx > 1e-4 || dy > 1e-4) {
          state.invalidate();
        }
      }
    }

    // Gooey intensity + scramble seed
    if (enableGooeyReveal) {
      effect.setMousePosition((mx + 1) / 2, (my + 1) / 2);

      if (isHovering && !wasHoveringRef.current) {
        scrambleSeedRef.current += 1;
        effect.setScrambleSeed(scrambleSeedRef.current);
      }
      wasHoveringRef.current = isHovering;

      const targetIntensity = +!!isHovering;
      gooeyIntensityRef.current +=
        (targetIntensity - gooeyIntensityRef.current) *
        (isHovering ? 0.08 : 0.06);
      effect.setGooeyIntensity(gooeyIntensityRef.current);

      if (
        !isHovering &&
        Math.abs(targetIntensity - gooeyIntensityRef.current) > 0.001
      ) {
        state.invalidate();
      }
    }
  });

  // Expose effect instance via ref
  React.useEffect(() => {
    if (effectRef) {
      effectRef.current = effect;
    }
    return () => {
      if (effectRef) {
        effectRef.current = null;
      }
    };
  }, [effect, effectRef]);

  return (
    <EffectComposer multisampling={0}>
      <primitive object={effect} />
    </EffectComposer>
  );
}
