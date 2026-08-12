"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { gsap, useGSAP, ScrollTrigger } from '@lib/vendor';
import { useIsTouchDevice } from '@shared/hooks/useIsTouchDevice';
import { useMousePosition } from '@shared/hooks/useMousePosition';
import { usePageEnter } from '@shared/hooks/usePageEnter';
import { ASCII_GSAP_DURATION, ASCII_EASE, ASCII_COLOR_DELAY } from '@shared/constants/constants';

function FallbackImage({ imageSrc }) {
  return (
    <div className="absolute inset-0 flex animate-fade-in items-center justify-center">
      <Image
        src={imageSrc}
        priority={true}
        alt=""
        className="h-full object-contain"
      />
    </div>
  );
}

export function HeroAsciiArt({
  imageSrc,
  mobileImageSrc,
  depthMapSrc,
  parallaxIntensity = 0.02,
  cellSize = 20,
  color,
  colorDark,
  revealOriginX,
  revealOriginY
}) {
  const isTouchDevice = useIsTouchDevice();
  const [isMounted, setIsMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  const containerRef = useRef(null);
  
  const [progress, setProgress] = useState(0);
  const [colorProgress, setColorProgress] = useState(0);
  const progressRef = useRef({
    progress: 0,
    colorProgress: 0
  });
  
  const shouldLoadAscii = isMounted && !prefersReducedMotion;
  const [AsciiTypewriter, setAsciiTypewriter] = useState(null);

  useEffect(() => {
    if (shouldLoadAscii) {
      import('./AsciiTypewriter').then((mod) => {
        setAsciiTypewriter(() => mod.AsciiTypewriter);
      });
    }
  }, [shouldLoadAscii]);

  const {
    mouseX,
    mouseY,
    isHovering
  } = useMousePosition({
    enabled: shouldLoadAscii && !isTouchDevice,
    containerRef: containerRef
  });

  const onPageEnterDelay = useCallback((delay) => {
    if (prefersReducedMotion) {
      setProgress(1);
      setColorProgress(1);
      return;
    }
    
    gsap.to(progressRef.current, {
      progress: 1,
      duration: ASCII_GSAP_DURATION,
      delay: delay,
      ease: ASCII_EASE,
      onUpdate: () => {
        setProgress(progressRef.current.progress);
      }
    });
    
    gsap.to(progressRef.current, {
      colorProgress: 1,
      duration: ASCII_GSAP_DURATION,
      delay: delay + ASCII_COLOR_DELAY,
      ease: ASCII_EASE,
      onUpdate: () => {
        setColorProgress(progressRef.current.colorProgress);
      }
    });
  }, [prefersReducedMotion]);

  usePageEnter(onPageEnterDelay, {
    priority: 0
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const activeImageSrc = isTouchDevice ? (mobileImageSrc ?? imageSrc) : imageSrc;

  if (isMounted && prefersReducedMotion) {
    return <FallbackImage imageSrc={activeImageSrc} />;
  }

  if (shouldLoadAscii && AsciiTypewriter) {
    return (
      <div ref={containerRef} className="absolute inset-0">
        <AsciiTypewriter
          imageSrc={activeImageSrc}
          cellSize={cellSize}
          color={color}
          colorDark={colorDark}
          className="size-full"
          alignX="center"
          alignY="bottom"
          fit="contain"
          mobileFit="contain"
          revealEnd={1}
          randomness={0.6}
          mouseX={isTouchDevice ? undefined : mouseX}
          mouseY={isTouchDevice ? undefined : mouseY}
          enableGooeyReveal={!isTouchDevice}
          isHovering={!isTouchDevice && isHovering}
          gooeyRadius={0.035}
          gooeySoftness={0.04}
          gooeyNoiseIntensity={0.02}
          enableDepthParallax={!isTouchDevice && !!depthMapSrc}
          depthMapSrc={isTouchDevice ? undefined : depthMapSrc}
          parallaxIntensity={parallaxIntensity}
          externalProgress={progress}
          externalColorProgress={colorProgress}
          disableInternalAnimation={true}
          {...(revealOriginX != null && revealOriginY != null ? {
            revealOrigin: {
              x: revealOriginX,
              y: revealOriginY
            }
          } : {})}
        />
      </div>
    );
  }

  return null;
}
