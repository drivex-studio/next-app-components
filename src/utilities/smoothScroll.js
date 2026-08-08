import React, { useEffect } from 'react';
import { ReactLenis, useLenis } from 'lenis/react'; 

let lenisInstance = null;
let isCssScrollLocked = false;

export function getLenis() {
  return lenisInstance;
}

export function setCssScrollLocked(locked) {
  if (locked !== isCssScrollLocked) {
    isCssScrollLocked = locked;
    if (locked) {
      document.documentElement.classList.add("scroll-locked");
    } else {
      document.documentElement.classList.remove("scroll-locked");
    }
  }
}

export function getCssScrollLocked() {
  return isCssScrollLocked;
}

export function scrollToTop(immediate = true) {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { immediate });
  } else {
    window.scrollTo(0, 0);
  }
}

function clearLenisInstance() {
  lenisInstance = null;
}


function LenisInstanceSync() {
  const lenis = useLenis();

  useEffect(() => {
    lenisInstance = lenis ?? null;
    return clearLenisInstance;
  }, [lenis]);

  return null;
}

function customEasing(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function LenisProvider({ children, ...props }) {
  const options = {
    anchors: {
      duration: 1.2,
      easing: customEasing
    }
  };

  return (
    <ReactLenis root={true} options={options} {...props}>
      <LenisInstanceSync />
      {children}
    </ReactLenis>
  );
}


export { LenisProvider as Lenis };
