import React, { useRef, useContext, useEffect, useCallback, useMemo } from 'react';
import gsap from 'gsap';
import { ScrambleGroupContext } from '../../contexts/ScrambleGroupContext';

export default function ScrambleText({
  children,
  className,
  duration = 0.6,
  chars = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  dualLayer = true,
  triggerOnHover = false,
  revealMode = false,
  theme = "dark",
  firstColorClass,
  secondColorClass,
  onComplete,
  onReady,
  multiLine = false
}) {
  const containerRef = useRef(null);
  const scrambleSpanRef = useRef(null);
  const timelineRef = useRef(null);
  const prevTextRef = useRef("");
  const hasRevealedRef = useRef(false);
  
  
  const scrambleIdRef = useRef(`scramble-${useMemo(() => Math.random().toString(36).slice(2, 9), [])}`);

  const themeConfig = theme === "brand" 
    ? { firstColorClass: "scramble-white", secondColorClass: "scramble-foreground" } 
    : { firstColorClass: "scramble-brand", secondColorClass: "scramble-foreground" };

  const colorClass1 = firstColorClass ?? themeConfig.firstColorClass;
  const colorClass2 = secondColorClass ?? themeConfig.secondColorClass;

  const scrambleGroupContextValue = useContext(ScrambleGroupContext);

  let textString = "";
  if (typeof children === "string") {
    textString = children;
  } else if (typeof children === "number") {
    textString = String(children);
  }

  useEffect(() => {
    prevTextRef.current = textString;
  }, [textString]);

  const killTimeline = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
  }, []);

  const scrambleAction = useCallback(() => {
    if (!scrambleSpanRef.current) {
      return null;
    }
    const target = scrambleSpanRef.current;
    const targetText = prevTextRef.current || textString;
    
    if (!targetText || targetText.length === 0) {
      return null;
    }
    
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      target.textContent = targetText;
      target.className = target.className.replace(/\bscramble-\w+\b/g, "");
      hasRevealedRef.current = true;
      onComplete?.();
      return null;
    }
    
    killTimeline();
    
    timelineRef.current = gsap.timeline({
      onComplete: () => {
        timelineRef.current = null;
        hasRevealedRef.current = true;
        onComplete?.();
      }
    });

    if (dualLayer) {
      const randomText = (function(text, charSet = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$") {
        let res = "";
        for (let i = 0; i < text.length; i++) {
          let char = text[i];
          if (char === " " || char === "\n" || char === "\r") {
            res += char;
          } else {
            res += charSet[Math.floor(Math.random() * charSet.length)];
          }
        }
        return res;
      })(targetText, chars);

      const nonSpaceCount = targetText.replace(/\s/g, "").length;
      const charDuration = nonSpaceCount > 0 ? duration / nonSpaceCount : 0;

      if (revealMode && !hasRevealedRef.current) {
        target.textContent = targetText.replace(/[^\s\n\r]/g, " ");
        timelineRef.current.to(target, {
          duration: duration,
          scrambleText: {
            text: randomText,
            chars: chars,
            speed: 1,
            revealDelay: 0.1,
            oldClass: colorClass1,
            newClass: colorClass1
          },
          ease: "none"
        });
      } else {
        timelineRef.current.to(target, {
          duration: duration,
          scrambleText: {
            text: randomText,
            chars: chars,
            speed: 1,
            revealDelay: 0.1,
            oldClass: colorClass2,
            newClass: colorClass1
          },
          ease: "none"
        });
      }
      
      timelineRef.current.to(target, {
        duration: duration,
        scrambleText: {
          text: targetText,
          chars: chars,
          speed: 1,
          revealDelay: 0.1,
          oldClass: colorClass1,
          newClass: colorClass2
        },
        ease: "none"
      }, charDuration);
      
    } else {
      timelineRef.current.to(target, {
        duration: duration,
        scrambleText: {
          text: targetText,
          chars: chars,
          speed: 1,
          revealDelay: 0.2
        },
        ease: "none"
      });
    }
    
    return timelineRef.current;
  }, [chars, dualLayer, duration, colorClass1, onComplete, revealMode, colorClass2, textString, killTimeline]);

  
  useEffect(() => {
    if (scrambleGroupContextValue) {
      scrambleGroupContextValue.register(scrambleIdRef.current, scrambleAction);
      return () => {
        scrambleGroupContextValue.unregister(scrambleIdRef.current);
      };
    }
  }, [scrambleGroupContextValue, scrambleAction]);

  
  useEffect(() => {
    onReady?.(scrambleAction);
  }, [onReady, scrambleAction]);

  const handleMouseEnter = useCallback(() => {
    if (triggerOnHover) {
      scrambleAction();
    }
  }, [scrambleAction, triggerOnHover]);

  
  useEffect(() => {
    return () => {
      killTimeline();
    };
  }, [killTimeline]);

  const scrambleTextInitial = revealMode ? textString.replace(/[^\s\n\r]/g, " ") : textString;
  const whiteSpace = multiLine ? "normal" : "nowrap";
  const display = multiLine ? "inline" : "inline-block";

  const containerStyle = useMemo(() => ({
    position: "relative",
    display,
    whiteSpace
  }), [display, whiteSpace]);

  const onMouseEnterProp = triggerOnHover ? handleMouseEnter : undefined;

  const hiddenStyle = useMemo(() => ({
    visibility: "hidden",
    whiteSpace
  }), [whiteSpace]);

  const absoluteStyle = useMemo(() => ({
    position: "absolute",
    top: 0,
    left: 0,
    whiteSpace,
    ...(multiLine ? { width: "100%" } : {})
  }), [multiLine, whiteSpace]);

  return (
    <span ref={containerRef} 
      className={className} 
      style={containerStyle} 
      onMouseEnter={onMouseEnterProp}
    >
      <span className="sr-only">
        {textString}
      </span>
      <span aria-hidden="true" style={hiddenStyle}>
        {textString}
      </span>
      <span ref={scrambleSpanRef} aria-hidden="true" style={absoluteStyle}>
        {scrambleTextInitial}
      </span>
    </span>
  );
}
