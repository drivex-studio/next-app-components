import * as React from "react";
import { useThree } from "@react-three/fiber"; // TODO: source not present — original hO
import { TextureLoader } from "three"; // TODO: source not present — original sG
import { resolveImageSrc } from "../utils/resolveImageSrc.js";

/**
 * Renders a textured plane that fits/covers the viewport according to align & fit props.
 * Supports optional stretch and rotation for hover effects.
 * original: f_
 */
export function AsciiImageMesh({
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
  const [texture, setTexture] = React.useState(null);
  const { viewport } = useThree();
  const meshRef = React.useRef(null);

  React.useEffect(() => {
    const loader = new TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      resolveImageSrc(imageSrc),
      (tex) => {
        setTexture(tex);
        onLoad?.();
      },
      undefined,
      (err) => {
        console.error("Failed to load texture:", err);
      }
    );
  }, [imageSrc, onLoad]);

  if (!texture) return null;

  const img = texture.image;
  const imageAspect = img.width / img.height;
  const viewportAspect = viewport.width / viewport.height;

  let width;
  let height;
  if (fit === "contain" && imageAspect > viewportAspect) {
    width = viewport.width;
    height = viewport.width / imageAspect;
  } else {
    height = viewport.height;
    width = viewport.height * imageAspect;
  }

  const finalWidth = width * stretchX;
  const finalHeight = height * stretchY;

  let posX = 0;
  const excessX = finalWidth - viewport.width;
  if (alignX === "left") posX = excessX / 2;
  else if (alignX === "right") posX = -excessX / 2;

  let posY = 0;
  const excessY = finalHeight - viewport.height;
  if (alignY === "bottom") posY = excessY / 2;
  else if (alignY === "top") posY = -excessY / 2;

  return (
    <mesh
      ref={meshRef}
      position={[posX, posY, 0]}
      rotation={[rotationX, rotationY, 0]}
    >
      <planeGeometry args={[finalWidth, finalHeight]} />
      <meshBasicMaterial
        map={texture}
        transparent={true}
        alphaTest={0.01}
      />
    </mesh>
  );
}
