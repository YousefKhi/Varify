import React, {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
  } from "react";
  import {
    motion,
    AnimatePresence,
    Transition,
    type VariantLabels,
    type Target,
    type AnimationControls,
    type TargetAndTransition,
  } from "framer-motion";
  
  function cn(...classes: (string | undefined | null | boolean)[]): string {
    return classes.filter(Boolean).join(" ");
  }
  
  export interface RotatingTextRef {
    next: () => void;
    previous: () => void;
    jumpTo: (index: number) => void;
    reset: () => void;
  }
  
  export interface RotatingTextProps
    extends Omit<
      React.ComponentPropsWithoutRef<typeof motion.span>,
      "children" | "transition" | "initial" | "animate" | "exit"
    > {
    texts: string[];
    transition?: Transition;
    initial?: boolean | Target | VariantLabels;
    animate?: boolean | VariantLabels | AnimationControls | TargetAndTransition;
    exit?: Target | VariantLabels;
    animatePresenceMode?: "sync" | "wait";
    animatePresenceInitial?: boolean;
    rotationInterval?: number;
    staggerDuration?: number;
    staggerFrom?: "first" | "last" | "center" | "random" | number;
    loop?: boolean;
    auto?: boolean;
    splitBy?: string;
    onNext?: (index: number) => void;
    mainClassName?: string;
    splitLevelClassName?: string;
    elementLevelClassName?: string;
  }
  
  const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
    (
      {
        texts,
        transition = { type: "spring", damping: 25, stiffness: 300 },
        initial = { y: "100%", opacity: 0 },
        animate = { y: 0, opacity: 1 },
        exit = { y: "-120%", opacity: 0 },
        animatePresenceMode = "wait",
        animatePresenceInitial = false,
        rotationInterval = 2000,
        staggerDuration = 0,
        staggerFrom = "first",
        loop = true,
        auto = true,
        splitBy = "characters",
        onNext,
        mainClassName,
        splitLevelClassName,
        elementLevelClassName,
        ...rest
      },
      ref
    ) => {
      const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);
  
      const splitIntoCharacters = useCallback((text: string): string[] => {
        if (typeof Intl !== "undefined" && Intl.Segmenter) {
          const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
          return Array.from(
            segmenter.segment(text),
            (segment) => segment.segment
          );
        }
        return Array.from(text);
      }, []);
  
      const elements = useMemo(() => {
        const currentText: string = texts[currentTextIndex];
        if (splitBy === "characters") {
          const words = currentText.split(" ");
          return words.map((word, i) => ({
            characters: splitIntoCharacters(word),
            needsSpace: i !== words.length - 1,
          }));
        }
        if (splitBy === "words") {
          return currentText.split(" ").map((word, i, arr) => ({
            characters: [word],
            needsSpace: i !== arr.length - 1,
          }));
        }
        if (splitBy === "lines") {
          return currentText.split("\n").map((line, i, arr) => ({
            characters: [line],
            needsSpace: i !== arr.length - 1,
          }));
        }
  
        return currentText.split(splitBy).map((part, i, arr) => ({
          characters: [part],
          needsSpace: i !== arr.length - 1,
        }));
      }, [texts, currentTextIndex, splitBy, splitIntoCharacters]);
  
      const getStaggerDelay = useCallback(
        (index: number, totalChars: number): number => {
          if (staggerDuration === 0) return 0;
          
          const total = totalChars;
          if (staggerFrom === "first") return index * staggerDuration;
          if (staggerFrom === "last") return (total - 1 - index) * staggerDuration;
          if (staggerFrom === "center") {
            const center = Math.floor(total / 2);
            return Math.abs(center - index) * staggerDuration;
          }
          if (staggerFrom === "random") {
            return ((index * 7919) % total) * staggerDuration;
          }
          return Math.abs((staggerFrom as number) - index) * staggerDuration;
        },
        [staggerFrom, staggerDuration]
      );
  
      const handleIndexChange = useCallback(
        (newIndex: number) => {
          setCurrentTextIndex(newIndex);
          if (onNext) onNext(newIndex);
        },
        [onNext]
      );
  
      const next = useCallback(() => {
        const nextIndex =
          currentTextIndex === texts.length - 1
            ? loop
              ? 0
              : currentTextIndex
            : currentTextIndex + 1;
        if (nextIndex !== currentTextIndex) {
          handleIndexChange(nextIndex);
        }
      }, [currentTextIndex, texts.length, loop, handleIndexChange]);
  
      const previous = useCallback(() => {
        const prevIndex =
          currentTextIndex === 0
            ? loop
              ? texts.length - 1
              : currentTextIndex
            : currentTextIndex - 1;
        if (prevIndex !== currentTextIndex) {
          handleIndexChange(prevIndex);
        }
      }, [currentTextIndex, texts.length, loop, handleIndexChange]);
  
      const jumpTo = useCallback(
        (index: number) => {
          const validIndex = Math.max(0, Math.min(index, texts.length - 1));
          if (validIndex !== currentTextIndex) {
            handleIndexChange(validIndex);
          }
        },
        [texts.length, currentTextIndex, handleIndexChange]
      );
  
      const reset = useCallback(() => {
        if (currentTextIndex !== 0) {
          handleIndexChange(0);
        }
      }, [currentTextIndex, handleIndexChange]);
  
      useImperativeHandle(
        ref,
        () => ({
          next,
          previous,
          jumpTo,
          reset,
        }),
        [next, previous, jumpTo, reset]
      );
  
      useEffect(() => {
        if (!auto) return;
        
        let timeoutId: number;
        let animationFrameId: number;
        
        const animate = (timestamp: number) => {
          timeoutId = window.setTimeout(() => {
            next();
            animationFrameId = window.requestAnimationFrame(animate);
          }, rotationInterval);
        };
        
        animationFrameId = window.requestAnimationFrame(animate);
        
        return () => {
          window.clearTimeout(timeoutId);
          window.cancelAnimationFrame(animationFrameId);
        };
      }, [next, rotationInterval, auto]);
  
      return (
        <motion.span
          className={cn(
            "flex flex-wrap whitespace-pre-wrap relative",
            mainClassName
          )}
          {...rest}
          layout="position"
          transition={transition}
          style={{ willChange: "transform, opacity" }}
        >
          <span className="sr-only">{texts[currentTextIndex]}</span>
          <AnimatePresence
            mode={animatePresenceMode}
            initial={animatePresenceInitial}
          >
            <motion.div
              key={currentTextIndex}
              className={cn(
                splitBy === "lines"
                  ? "flex flex-col w-full"
                  : "flex flex-wrap whitespace-pre-wrap relative"
              )}
              layout="position"
              aria-hidden="true"
              style={{ willChange: "transform" }}
            >
              {elements.map((wordObj, wordIndex, array) => {
                const previousCharsCount = array
                  .slice(0, wordIndex)
                  .reduce((sum, word) => sum + word.characters.length, 0);
                  
                const totalChars = array.reduce(
                  (sum, word) => sum + word.characters.length, 0
                );
                
                return (
                  <span
                    key={wordIndex}
                    className={cn("inline-flex", splitLevelClassName)}
                  >
                    {wordObj.characters.map((char, charIndex) => {
                      const delay = getStaggerDelay(
                        previousCharsCount + charIndex,
                        totalChars
                      );
                      
                      return (
                        <motion.span
                          key={charIndex}
                          initial={initial}
                          animate={animate}
                          exit={exit}
                          transition={{
                            ...transition,
                            delay,
                          }}
                          className={cn("inline-block", elementLevelClassName)}
                          style={{ willChange: delay > 0 ? "transform, opacity" : undefined }}
                        >
                          {char}
                        </motion.span>
                      );
                    })}
                    {wordObj.needsSpace && (
                      <span className="whitespace-pre"> </span>
                    )}
                  </span>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </motion.span>
      );
    }
  );
  
  RotatingText.displayName = "RotatingText";
  export default RotatingText;
  