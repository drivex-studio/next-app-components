import { Effect } from "postprocessing";
import {
  Color,
  Texture,
  CanvasTexture,
  Uniform,
  LinearFilter,
  ClampToEdgeWrapping,
} from "three";
import { asciiFragmentShader } from "./shaders/asciiFragmentShader.js";
import {
  incrementTextureCount,
  decrementTextureCount,
} from "../utils/debug/asciiDebug.js";



export class AsciiEffect extends Effect {
  charactersTexture = null;
  depthMapTexture = null;
  framesToSkip = 0;
  visibilityHandler = null;

  constructor({
    characters = " .:,'-^=*+?!|0#X%WM@",
    fontSize = 54,
    cellSize = 30,
    color = "#ffffff",
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
    depthDetailMin = 1,
    revealOrigin = { x: 0.5, y: 0.5 },
  } = {}) {
    super("ASCIIEffect", asciiFragmentShader, {
      uniforms: new Map([
        ["uCharacters", new Uniform(new Texture())],
        ["uCellSize", new Uniform(cellSize)],
        ["uCharactersCount", new Uniform(characters.length)],
        ["uColor", new Uniform(new Color(color))],
        ["uInvert", new Uniform(invert)],
        ["uAlphaThreshold", new Uniform(alphaThreshold)],
        ["uRespectAlpha", new Uniform(respectAlpha)],
        ["uProgress", new Uniform(progress)],
        ["uColorProgress", new Uniform(colorProgress)],
        ["uRandomness", new Uniform(randomness)],
        ["uRevealDirection", new Uniform(revealDirection)],
        ["uRevealEnd", new Uniform(revealEnd)],
        ["uEnableGooeyReveal", new Uniform(enableGooeyReveal)],
        ["uMouse", new Uniform({ x: -1, y: -1 })],
        ["uGooeyRadius", new Uniform(gooeyRadius)],
        ["uGooeySoftness", new Uniform(gooeySoftness)],
        ["uGooeyNoiseIntensity", new Uniform(gooeyNoiseIntensity)],
        ["uGooeyIntensity", new Uniform(0)],
        ["uScrambleSeed", new Uniform(0)],
        ["uTime", new Uniform(0)],
        ["uHeadTurnAmount", new Uniform(0)],
        ["uDepthMap", new Uniform(new Texture())],
        ["uEnableDepthParallax", new Uniform(enableDepthParallax)],
        ["uParallaxIntensity", new Uniform(parallaxIntensity)],
        ["uParallaxOffset", new Uniform({ x: 0, y: 0 })],
        ["uColorDark", new Uniform(new Color(colorDark ?? color))],
        ["uDepthDetailMin", new Uniform(depthDetailMin)],
        ["uClickPoint", new Uniform({ x: -1, y: -1 })],
        ["uRadialInvert", new Uniform(0)],
        ["uImpactProgress", new Uniform(0)],
        [
          "uRevealOrigin",
          new Uniform({ x: revealOrigin.x, y: revealOrigin.y }),
        ],
      ]),
    });

    const charactersUniform = this.uniforms.get("uCharacters");
    if (charactersUniform) {
      this.charactersTexture = this.createCharactersTexture(characters, fontSize);
      charactersUniform.value = this.charactersTexture;
    }

    if (typeof document !== "undefined") {
      this.visibilityHandler = () => {
        if (document.visibilityState === "visible") {
          this.framesToSkip = 5;
        }
      };
      document.addEventListener("visibilitychange", this.visibilityHandler);
    }
  }

  dispose() {
    if (this.visibilityHandler && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this.visibilityHandler);
      this.visibilityHandler = null;
    }
    if (this.charactersTexture) {
      this.charactersTexture.dispose();
      this.charactersTexture = null;
      decrementTextureCount();
    }
    if (this.depthMapTexture) {
      this.depthMapTexture.dispose();
      this.depthMapTexture = null;
      decrementTextureCount();
    }
    super.dispose();
  }

  update(renderer, inputBuffer, deltaTime) {
    if (deltaTime === undefined) return;
    if (1000 * deltaTime > 500) {
      this.framesToSkip = 5;
    }
    if (this.framesToSkip > 0) {
      this.framesToSkip--;
      return;
    }
    const timeUniform = this.uniforms.get("uTime");
    if (timeUniform) {
      const clamped = Math.min(deltaTime, 0.033);
      timeUniform.value += clamped;
      if (timeUniform.value > 1000) {
        timeUniform.value = timeUniform.value % 1000;
      }
    }
  }

  createCharactersTexture(characters, fontSize) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1024;
    const texture = new CanvasTexture(canvas);
    texture.generateMipmaps = false;
    texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
    texture.magFilter = texture.minFilter = LinearFilter;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Context not available");

    const font = `${fontSize}px "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`;

    const draw = () => {
      ctx.clearRect(0, 0, 1024, 1024);
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      for (let i = 0; i < characters.length; i++) {
        const ch = characters[i];
        const col = i % 16;
        const row = Math.floor(i / 16);
        if (ch) {
          ctx.fillText(ch, 64 * col + 32, 64 * row + 32);
        }
      }
      texture.needsUpdate = true;
    };

    draw();

    if (typeof document !== "undefined" && document.fonts?.load) {
      document.fonts
        .load(font)
        .then(() => {
          draw();
        })
        .catch(() => {});
      setTimeout(() => {
        draw();
      }, 100);
    }

    incrementTextureCount();
    return texture;
  }

  setColor(color) {
    const u = this.uniforms.get("uColor");
    if (u) u.value = new Color(color);
  }

  setCellSize(size) {
    const u = this.uniforms.get("uCellSize");
    if (u) u.value = size;
  }

  setProgress(value) {
    const u = this.uniforms.get("uProgress");
    if (u) u.value = value;
  }

  setColorProgress(value) {
    const u = this.uniforms.get("uColorProgress");
    if (u) u.value = value;
  }

  setRandomness(value) {
    const u = this.uniforms.get("uRandomness");
    if (u) u.value = value;
  }

  setMousePosition(x, y) {
    const u = this.uniforms.get("uMouse");
    if (u) u.value = { x, y };
  }

  setEnableGooeyReveal(enabled) {
    const u = this.uniforms.get("uEnableGooeyReveal");
    if (u) u.value = enabled;
  }

  setGooeyRadius(value) {
    const u = this.uniforms.get("uGooeyRadius");
    if (u) u.value = value;
  }

  setGooeySoftness(value) {
    const u = this.uniforms.get("uGooeySoftness");
    if (u) u.value = value;
  }

  setGooeyNoiseIntensity(value) {
    const u = this.uniforms.get("uGooeyNoiseIntensity");
    if (u) u.value = value;
  }

  setScrambleSeed(value) {
    const u = this.uniforms.get("uScrambleSeed");
    if (u) u.value = value;
  }

  setGooeyIntensity(value) {
    const u = this.uniforms.get("uGooeyIntensity");
    if (u) u.value = value;
  }

  setHeadTurnAmount(value) {
    const u = this.uniforms.get("uHeadTurnAmount");
    if (u) u.value = value;
  }

  setDepthMap(texture) {
    if (this.depthMapTexture) {
      this.depthMapTexture.dispose();
      decrementTextureCount();
    }
    this.depthMapTexture = texture;
    incrementTextureCount();
    const u = this.uniforms.get("uDepthMap");
    if (u) u.value = texture;
  }

  setEnableDepthParallax(enabled) {
    const u = this.uniforms.get("uEnableDepthParallax");
    if (u) u.value = enabled;
  }

  setParallaxOffset(x, y) {
    const u = this.uniforms.get("uParallaxOffset");
    if (u) u.value = { x, y };
  }

  setParallaxIntensity(value) {
    const u = this.uniforms.get("uParallaxIntensity");
    if (u) u.value = value;
  }

  setDepthDetailMin(value) {
    const u = this.uniforms.get("uDepthDetailMin");
    if (u) u.value = value;
  }

  setImpactProgress(value) {
    const u = this.uniforms.get("uImpactProgress");
    if (u) u.value = value;
  }

  setRadialInvert(value) {
    const u = this.uniforms.get("uRadialInvert");
    if (u) u.value = value;
  }

  setClickPoint(x, y) {
    const u = this.uniforms.get("uClickPoint");
    if (u) u.value = { x, y };
  }

  setRevealOrigin(x, y) {
    const u = this.uniforms.get("uRevealOrigin");
    if (u) u.value = { x, y };
  }

  setColorDark(color) {
    const u = this.uniforms.get("uColorDark");
    if (u) u.value = new Color(color);
  }
}
