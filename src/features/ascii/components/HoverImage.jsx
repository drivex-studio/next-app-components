import * as React from "react";
import { AsciiImageMesh } from "./AsciiImageMesh.jsx";

/**
 * Applies hover-based stretch / head-turn transforms to AsciiImageMesh.
 * original: fT
 */
export function HoverImage({
  imageSrc,
  onLoad,
  alignX,
  alignY,
  fit,
  enableHover,
  hoverMode,
  hoverIntensity,
  mouseX,
  mouseY,
  isHovering,
}) {
  let stretchX = 1;
  let stretchY = 1;
  let rotationY = 0;

  if (enableHover && isHovering) {
    if (hoverMode === "headTurn") {
      rotationY = -mouseX * hoverIntensity;
    } else {
      if (alignX === "left") {
        stretchX = 1 + ((mouseX + 1) / 2) * hoverIntensity;
      } else if (alignX === "right") {
        stretchX = 1 + ((1 - mouseX) / 2) * hoverIntensity;
      } else if (alignX === "center") {
        stretchX = 1 + Math.abs(mouseX) * hoverIntensity;
      }
      stretchY = 1 + ((1 - mouseY) / 2) * hoverIntensity;
    }
  }

  return (
    <AsciiImageMesh
      imageSrc={imageSrc}
      onLoad={onLoad}
      alignX={alignX}
      alignY={alignY}
      fit={fit}
      stretchX={stretchX}
      stretchY={stretchY}
      rotationX={0}
      rotationY={rotationY}
    />
  );
}
