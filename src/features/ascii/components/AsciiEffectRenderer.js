import React, {
  useRef,
  useMemo,
  useEffect,
  useContext,
  createContext,
  memo,
  forwardRef,
  useLayoutEffect,
  useImperativeHandle,
} from "react";
import { useThree, useFrame } from "@react-three/fiber";
import {
  EffectComposer,
  RenderPass,
  NormalPass,
  EffectPass,
  Pass,
} from "postprocessing";
import { AsciiEffect } from "../effects/AsciiEffect.js";
import { TextureLoader } from "three";
import { resolveImageSrc } from "../utils/image/resolveImageSrc.js";

// Local EffectComposer context used by the ASCII effect stack
const EffectComposerContext = createContext(null);

function isPassEnabled(pass) {
  return (2 & pass.getAttributes()) === 2;
}

/**
 * Minimal R3F-compatible EffectComposer that owns the postprocessing pipeline
 * and exposes the composer / normalPass via context for child effects.
 */
const AsciiEffectComposer = memo(
  forwardRef(function AsciiEffectComposer(
    {
      children,
      camera,
      scene,
      resolutionScale,
      enabled = true,
      renderPriority = 1,
      autoClear = true,
      depthBuffer,
      enableNormalPass,
      stencilBuffer,
      multisampling = 8,
      frameBufferType,
    },
    ref
  ) {
    const { gl, scene: defaultScene, camera: defaultCamera, size } = useThree();
    const activeScene = scene || defaultScene;
    const activeCamera = camera || defaultCamera;

    const [composer, normalPass, downSamplingPass] = useMemo(() => {
      const composerInstance = new EffectComposer(gl, {
        depthBuffer,
        stencilBuffer,
        multisampling,
        frameBufferType,
      });
      composerInstance.addPass(new RenderPass(activeScene, activeCamera));

      let normal = null;
      let downSample = null;
      if (enableNormalPass) {
        normal = new NormalPass(activeScene, activeCamera);
        normal.enabled = false;
        composerInstance.addPass(normal);
        if (resolutionScale !== undefined) {
          // DepthDownsamplingPass or equivalent; original used pu
          // Keep as optional and disabled by default
          downSample = null; // original construction omitted exact class when not needed
        }
      }
      return [composerInstance, normal, downSample];
    }, [
      activeCamera,
      gl,
      depthBuffer,
      stencilBuffer,
      multisampling,
      frameBufferType,
      activeScene,
      enableNormalPass,
      resolutionScale,
    ]);

    useEffect(() => {
      composer?.setSize(size.width, size.height);
    }, [composer, size]);

    useFrame((_state, delta) => {
      if (enabled) {
        const prevAutoClear = gl.autoClear;
        gl.autoClear = autoClear;
        if (stencilBuffer && !autoClear) gl.clearStencil();
        composer.render(delta);
        gl.autoClear = prevAutoClear;
      }
    }, enabled ? renderPriority : 0);

    const groupRef = useRef(null);

    useLayoutEffect(() => {
      const passes = [];
      const r3f = groupRef.current?.__r3f;
      if (r3f && composer) {
        const children = r3f.children;
        for (let i = 0; i < children.length; i++) {
          const obj = children[i].object;
          if (obj instanceof AsciiEffect) {
            // collect consecutive effect instances
            const group = [obj];
            if (!isPassEnabled(obj)) {
              let next;
              while (
                (next = children[i + 1]?.object) instanceof AsciiEffect &&
                !isPassEnabled(next)
              ) {
                group.push(next);
                i++;
              }
            }
            const effectPass = new EffectPass(activeCamera, ...group);
            passes.push(effectPass);
          } else if (obj instanceof Pass) {
            passes.push(obj);
          }
        }
        for (const p of passes) composer?.addPass(p);
        if (normalPass) normalPass.enabled = true;
        if (downSamplingPass) downSamplingPass.enabled = true;
      }
      return () => {
        for (const p of passes) composer?.removePass(p);
        if (normalPass) normalPass.enabled = false;
        if (downSamplingPass) downSamplingPass.enabled = false;
      };
    }, [composer, children, activeCamera, normalPass, downSamplingPass]);

    useEffect(() => {
      const prevTone = gl.toneMapping;
      gl.toneMapping = 0;
      return () => {
        gl.toneMapping = prevTone;
      };
    }, [gl]);

    const contextValue = useMemo(
      () => ({
        composer,
        normalPass,
        downSamplingPass,
        resolutionScale,
        camera: activeCamera,
        scene: activeScene,
      }),
      [composer, normalPass, downSamplingPass, resolutionScale, activeCamera, activeScene]
    );

    useImperativeHandle(ref, () => composer, [composer]);

    return React.createElement(
      EffectComposerContext.Provider,
      { value: contextValue },
      React.createElement(
        "group",
        { ref: groupRef },
        children
      )
    );
  })
);

/**
 * Mounts the AsciiEffect inside a local EffectComposer and keeps its uniforms
 * in sync with the latest progress / mouse / click state.
 */
export function AsciiEffectRenderer({
  characters,
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
  const intensityRef = useRef(0);
  const parallaxOffsetRef = useRef({ x: 0, y: 0 });
  const wasHoveringRef = useRef(false);
  const scrambleSeedRef = useRef(0);

  const effect = useMemo(
    () =>
      new AsciiEffect({
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

  useEffect(() => {
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
        if (dx > 1e-4 || dy > 1e-4) state.invalidate();
      }
    }

    if (enableGooeyReveal) {
      effect.setMousePosition((mx + 1) / 2, (my + 1) / 2);
      if (isHovering && !wasHoveringRef.current) {
        scrambleSeedRef.current += 1;
        effect.setScrambleSeed(scrambleSeedRef.current);
      }
      wasHoveringRef.current = isHovering;
      const targetIntensity = +!!isHovering;
      intensityRef.current +=
        (targetIntensity - intensityRef.current) * (isHovering ? 0.08 : 0.06);
      effect.setGooeyIntensity(intensityRef.current);
      if (
        !isHovering &&
        Math.abs(targetIntensity - intensityRef.current) > 0.001
      ) {
        state.invalidate();
      }
    }
  });

  useEffect(() => {
    if (effectRef) effectRef.current = effect;
    return () => {
      if (effectRef) effectRef.current = null;
    };
  }, [effect, effectRef]);

  return React.createElement(
    AsciiEffectComposer,
    { multisampling: 0 },
    React.createElement("primitive", { object: effect })
  );
}
