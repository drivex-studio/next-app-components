import React, { useState, useEffect, useRef, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { TextureLoader } from "three";
import { resolveImageSrc } from "../utils/image/resolveImageSrc.js";

function onTextureError(err) {
  console.error("Failed to load texture:", err);
}

/**
 * Renders a textured plane that fits / covers the viewport according to the
 * given alignment and fit mode, with optional stretch / rotation for hover.
 */
export function AsciiImagePlane({
  imageSrc,
  onLoad,
  alignX = "center",
  alignY = "bottom",
  fit = "cover",
  stretchX = 1,
  stretchY = 1,
  rotationY = 0,
  rotationX = 0,
}) {
  const [texture, setTexture] = useState(null);
  const { viewport } = useThree();
  const meshRef = useRef(null);

  useEffect(() => {
    const loader = new TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      resolveImageSrc(imageSrc),
      (tex) => {
        setTexture(tex);
        onLoad?.();
      },
      undefined,
      onTextureError
    );
  }, [imageSrc, onLoad]);

  if (!texture) return null;

  const img = texture.image;
  const aspect = img.width / img.height;
  const viewportAspect = viewport.width / viewport.height;

  let width;
  let height;
  if (fit === "contain" && aspect > viewportAspect) {
    width = viewport.width;
    height = viewport.width / aspect;
  } else {
    height = viewport.height;
    width = viewport.height * aspect;
  }

  const finalWidth = width * stretchX;
  const finalHeight = height * stretchY;

  let offsetX = 0;
  const excessX = finalWidth - viewport.width;
  if (alignX === "left") offsetX = excessX / 2;
  else if (alignX === "right") offsetX = -excessX / 2;

  let offsetY = 0;
  const excessY = finalHeight - viewport.height;
  if (alignY === "bottom") offsetY = excessY / 2;
  else if (alignY === "top") offsetY = -excessY / 2;

  return React.createElement(
    "mesh",
    {
      ref: meshRef,
      position: [offsetX, offsetY, 0],
      rotation: [rotationX, rotationY, 0],
    },
    React.createElement("planeGeometry", { args: [finalWidth, finalHeight] }),
    React.createElement("meshBasicMaterial", {
      map: texture,
      transparent: true,
      alphaTest: 0.01,
    })
  );
}
