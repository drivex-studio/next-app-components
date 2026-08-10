import { useState, useEffect, useRef } from 'react';

export function useMousePosition(options) {
  const {
    lerp = 0.08,
    enabled = true,
    containerRef,
    refOnly = false
  } = options ?? {};

  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let frameId;

    if (!enabled) {
      if (!refOnly) {
        setMouseX(0);
        setMouseY(0);
      }
      mouseRef.current.x = 0;
      mouseRef.current.y = 0;
      setIsHovering(false);
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let isInside = false;

    const handleMouseMove = (event) => {
      const container = containerRef?.current;
      
      if (container) {
        const rect = container.getBoundingClientRect();
        const normX = (event.clientX - rect.left) / rect.width;
        const normY = (event.clientY - rect.top) / rect.height;

        if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
          if (!isInside) {
            isInside = true;
            setIsHovering(true);
          }
          targetX = (normX * 2) - 1;
          targetY = (1 - normY) * 2 - 1;
        } else if (isInside) {
          isInside = false;
          setIsHovering(false);
          targetX = 0;
          targetY = 0;
        }
      } else {
        targetX = (event.clientX / window.innerWidth) * 2 - 1;
        targetY = (event.clientY / window.innerHeight) * 2 - 1;
      }
      
      startAnimation();
    };

    const handleDocumentMouseLeave = () => {
      targetX = 0;
      targetY = 0;
      startAnimation();
    };

    const handleMouseEnter = () => {
      isInside = true;
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      isInside = false;
      setIsHovering(false);
      targetX = 0;
      targetY = 0;
      startAnimation();
    };

    const startAnimation = () => {
      if (!frameId) {
        frameId = requestAnimationFrame(animate);
      }
    };

    const animate = () => {
      currentX += (targetX - currentX) * lerp;
      currentY += (targetY - currentY) * lerp;
      
      mouseRef.current.x = currentX;
      mouseRef.current.y = currentY;
      
      if (!refOnly) {
        setMouseX(currentX);
        setMouseY(currentY);
      }

      if (Math.abs(targetX - currentX) > 1e-4 || Math.abs(targetY - currentY) > 1e-4) {
        frameId = requestAnimationFrame(animate);
      } else {
        frameId = 0;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleDocumentMouseLeave);

    const containerNode = containerRef?.current;
    if (containerNode) {
      containerNode.addEventListener("mouseenter", handleMouseEnter);
      containerNode.addEventListener("mouseleave", handleMouseLeave);
    } else {
      document.addEventListener("mouseenter", handleMouseEnter);
      document.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleDocumentMouseLeave);
      
      if (containerNode) {
        containerNode.removeEventListener("mouseenter", handleMouseEnter);
        containerNode.removeEventListener("mouseleave", handleMouseLeave);
      } else {
        document.addEventListener("mouseenter", handleMouseEnter);
        document.addEventListener("mouseleave", handleMouseLeave);
      }
      
      cancelAnimationFrame(frameId);
    };
  }, [lerp, enabled, containerRef, refOnly]);

  return { mouseX, mouseY, isHovering, mouseRef };
}