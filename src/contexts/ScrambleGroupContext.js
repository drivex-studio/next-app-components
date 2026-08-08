import React, { createContext, useRef, useState, useContext, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useIdleGSAP from './shared/useIdleGSAP';

gsap.registerPlugin(ScrollTrigger);

export const ScrambleGroupContext = createContext(null);

export function ScrambleGroup({
  children,
  stagger = 0.1,
  start = "top 80%",
  markers = false,
  manual = false,
  className
}) {
  const containerRef = useRef(null);
  const callbacksMapRef = useRef(new Map());
  const [hasTriggered, setHasTriggered] = useState(false);
  const isTriggeringRef = useRef(false);
  const scrollTriggerRef = useRef(null);

  const register = useCallback((id, callback) => {
    callbacksMapRef.current.set(id, callback);
  }, []);

  const unregister = useCallback((id) => {
    callbacksMapRef.current.delete(id);
  }, []);

  const triggerAll = useCallback((customStagger) => {
    if (isTriggeringRef.current) {
      return;
    }
    
    isTriggeringRef.current = true;
    
    const callbacks = Array.from(callbacksMapRef.current.values());
    const staggerValue = customStagger ?? stagger;
    
    callbacks.forEach((callback, index) => {
      gsap.delayedCall(index * staggerValue, () => {
        callback();
      });
    });
    
    setHasTriggered(true);
  }, [stagger]);

  const gsapEffectCallback = useCallback(() => {
    if (manual || !containerRef.current) {
      return;
    }
    
    isTriggeringRef.current = false;
    
    const animation = gsap.to(containerRef.current, {
      scrollTrigger: {
        trigger: containerRef.current,
        start: start,
        markers: markers,
        toggleActions: "play none none none"
      },
      onStart: () => {
        triggerAll();
      },
      duration: 0.001
    });
    
    scrollTriggerRef.current = animation.scrollTrigger ?? null;
    
    return () => {
      animation.kill();
      scrollTriggerRef.current?.kill();
    };
  }, [manual, start, markers, triggerAll]);

  const gsapEffectConfig = useMemo(() => ({
    dependencies: [manual, start, markers, triggerAll]
  }), [manual, start, markers, triggerAll]);

  useIdleGSAP(gsapEffectCallback, gsapEffectConfig);

  const contextValue = useMemo(() => ({
    register,
    unregister,
    triggerAll,
    hasTriggered
  }), [register, unregister, triggerAll, hasTriggered]);

  return (
    <ScrambleGroupContext.Provider value={contextValue}>
      <div ref={containerRef} className={className}>
        {children}
      </div>
    </ScrambleGroupContext.Provider>
  );
}

export function useScrambleGroup() {
  return useContext(ScrambleGroupContext);
}
