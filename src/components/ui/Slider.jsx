import React, { createContext, useContext, useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Slot } from '@radix-ui/react-slot';
import { cx } from '@lib/vendor';


const SliderContext = createContext(null);

export function useSliderContext() {
  const context = useContext(SliderContext);
  if (!context) {
    throw Error("useSliderContext must be used within a Slider");
  }
  return context;
}

const defaultOptions = { align: "start" };

export function Root({ children, className, options = {} }) {
  const mergedOptions = { ...defaultOptions, ...options };
  const [emblaRef, emblaApi] = useEmblaCarousel(mergedOptions);

  const [progress, setProgress] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;

    const handleScrollProgress = () => {
      setProgress(Math.max(0, Math.min(1, emblaApi.scrollProgress() ?? 0)));
    };

    const handleScrollSnaps = () => {
      setScrollSnaps(emblaApi.scrollSnapList() ?? []);
    };

    const handleSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap() ?? 0);
    };

    const handleScrollBounds = () => {
      setCanScrollPrev(emblaApi.canScrollPrev() ?? false);
      setCanScrollNext(emblaApi.canScrollNext() ?? false);
    };

    const onReInit = () => {
      handleScrollProgress();
      handleScrollSnaps();
      handleSelect();
      handleScrollBounds();
    };

    const onSelectEvent = () => {
      handleSelect();
      handleScrollBounds();
    };

    const onScrollEvent = () => {
      handleScrollProgress();
      handleScrollBounds();
    };

    const onSlideFocus = () => {
      handleScrollProgress();
    };

    onReInit();

    emblaApi.on("reInit", onReInit);
    emblaApi.on("scroll", onScrollEvent);
    emblaApi.on("select", onSelectEvent);
    emblaApi.on("slideFocus", onSlideFocus);

    return () => {
      emblaApi.off("reInit", onReInit);
      emblaApi.off("scroll", onScrollEvent);
      emblaApi.off("select", onSelectEvent);
      emblaApi.off("slideFocus", onSlideFocus);
    };
  }, [emblaApi]);

  const value = {
    embla: emblaApi,
    ref: emblaRef,
    progress,
    scrollSnaps,
    selectedIndex,
    canScrollPrev,
    canScrollNext
  };

  const rootClassName = cx("group/slider relative", className);

  return (
    <div data-root className={rootClassName}>
      <SliderContext.Provider value={value}>
        {children}
      </SliderContext.Provider>
    </div>
  );
}

export function Viewport({ children, className, asChild, ...rest }) {
  const Comp = asChild ? Slot : "div";
  const { ref } = useSliderContext();

  return (
    <Comp data-viewport ref={ref} className={className} {...rest}>
      {children}
    </Comp>
  );
}

export function Slides({ children, className, asChild, ...rest }) {
  const Comp = asChild ? Slot : "div";
  const slidesClassName = cx("flex items-stretch will-change-transform", className);

  return (
    <Comp data-slides className={slidesClassName} {...rest}>
      {children}
    </Comp>
  );
}

export function Slide({ children, className, asChild, ...rest }) {
  const Comp = asChild ? Slot : "div";
  const slideClassName = cx("min-w-0 shrink-0 grow-0 select-none", className);

  return (
    <Comp data-slide className={slideClassName} {...rest}>
      {children}
    </Comp>
  );
}

export function NextButton({ asChild, children, className, ...rest }) {
  const Comp = asChild ? Slot : "button";
  const { embla, canScrollNext } = useSliderContext();

  const onClick = () => embla?.scrollNext();
  const disabled = !canScrollNext;
  const buttonClassName = cx("cursor-pointer disabled:pointer-events-none", className);

  return (
    <Comp
      {...rest}
      type="button"
      aria-label="Next slide"
      onClick={onClick}
      disabled={disabled}
      className={buttonClassName}
    >
      {children}
    </Comp>
  );
}

export function PrevButton({ asChild, children, className, ...rest }) {
  const Comp = asChild ? Slot : "button";
  const { embla, canScrollPrev } = useSliderContext();

  const onClick = () => embla?.scrollPrev();
  const disabled = !canScrollPrev;
  const buttonClassName = cx("cursor-pointer disabled:pointer-events-none", className);

  return (
    <Comp
      {...rest}
      type="button"
      aria-label="Previous slide"
      onClick={onClick}
      disabled={disabled}
      className={buttonClassName}
    >
      {children}
    </Comp>
  );
}
