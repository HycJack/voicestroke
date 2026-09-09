import { useRef, useCallback, useEffect, useState } from "react";
import HanziWriter from "hanzi-writer";
import { cancelStrokeVoice } from "@/utils/strokeSpeech";
import type { StrokePoint } from "@/utils/strokeName";

export type PlayMode = "auto" | "step";

interface UseHanziWriterOptions {
  char: string | null;
  size: number;
  speed?: number;
  replayKey?: number;
  mode?: PlayMode;
  onComplete?: () => void;
  onError?: (char: string) => void;
  /** 每笔动画开始前触发（auto 逐笔播放 & step「下一笔」），参数为笔画索引 */
  onStrokeStart?: (strokeIndex: number) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HanziWriterInstance = any;

function getStrokeCount(writer: HanziWriterInstance): number {
  try {
    const charData = writer._character ?? writer._char;
    if (charData && typeof charData === "object" && "strokes" in charData) {
      return charData.strokes.length;
    }
  } catch {
    /* ignore */
  }
  return 0;
}

export function useHanziWriter({
  char,
  size,
  speed = 1,
  replayKey = 0,
  mode = "auto",
  onComplete,
  onError,
  onStrokeStart,
}: UseHanziWriterOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriterInstance>(null);
  const currentStrokeRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [strokeProgress, setStrokeProgress] = useState({ current: 0, total: 0 });
  const [strokes, setStrokes] = useState<string[]>([]);
  const [medians, setMedians] = useState<StrokePoint[][]>([]);
  const strokesRef = useRef<string[]>([]);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const onStrokeStartRef = useRef(onStrokeStart);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
    onStrokeStartRef.current = onStrokeStart;
  }, [onComplete, onError, onStrokeStart]);

  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  // 卸载/切换时清理：停止动画定时器与语音播报
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      writerRef.current?.cancelQuiz?.();
      cancelStrokeVoice();
    };
  }, []);

  const createWriter = useCallback(
    (target: string): HanziWriterInstance | null => {
      if (!containerRef.current) return null;
      containerRef.current.innerHTML = "";
      try {
        const writer = HanziWriter.create(containerRef.current, target, {
          width: size,
          height: size,
          padding: 4,
          showOutline: true,
          showCharacter: false,
          strokeAnimationSpeed: speed,
          delayBetweenStrokes: Math.round(300 / speed),
          strokeColor: "#1e293b",
          outlineColor: "#cbd5e1",
          radicalColor: "#3b82f6",
        });
        writerRef.current = writer;
        currentStrokeRef.current = 0;
        setStrokeProgress({ current: 0, total: 0 });
        return writer;
      } catch {
        return null;
      }
    },
    [size, speed]
  );

  /**
   * auto 模式的逐笔动画链：
   * 与 animateCharacter 不同，逐笔调用才能触发每笔的 onStrokeStart 回调（跟读播报）。
   */
  const animateSequential = useCallback(
    (target: string, total: number) => {
      const writer = createWriter(target);
      if (!writer) {
        onErrorRef.current?.(target);
        return;
      }
      if (total <= 0) {
        setIsAnimating(false);
        onCompleteRef.current?.();
        return;
      }
      setIsAnimating(true);
      const delay = Math.round(300 / speed);
      let i = 0;

      const next = () => {
        if (i >= total) {
          setIsAnimating(false);
          onCompleteRef.current?.();
          return;
        }
        onStrokeStartRef.current?.(i);
        setStrokeProgress({ current: i + 1, total });
        writer.animateStroke(i, {
          onComplete: () => {
            i += 1;
            if (i < total) {
              timerRef.current = window.setTimeout(next, delay);
            } else {
              setIsAnimating(false);
              onCompleteRef.current?.();
            }
          },
        });
      };
      next();
    },
    [createWriter, speed]
  );

  const animateNextStroke = useCallback(() => {
    const writer = writerRef.current;
    if (!writer) return;

    let total = getStrokeCount(writer);
    if (total === 0) total = 99;

    if (currentStrokeRef.current >= total) {
      onCompleteRef.current?.();
      return;
    }

    setIsAnimating(true);
    onStrokeStartRef.current?.(currentStrokeRef.current);
    writer.animateStroke(currentStrokeRef.current, {
      onComplete: () => {
        currentStrokeRef.current += 1;
        const realTotal = getStrokeCount(writer) || total;
        setStrokeProgress({ current: currentStrokeRef.current, total: realTotal });
        setIsAnimating(false);
      },
    });
  }, []);

  const resetStrokes = useCallback(() => {
    const writer = writerRef.current;
    if (!writer) return;
    writer.hideCharacter();
    currentStrokeRef.current = 0;
    setStrokeProgress((p) => ({ current: 0, total: p.total }));
  }, []);

  const pollStrokeCount = useCallback(
    (writer: HanziWriterInstance, onReady: (n: number) => void) => {
      const check = setInterval(() => {
        const n = getStrokeCount(writer);
        if (n > 0) {
          clearInterval(check);
          onReady(n);
        }
      }, 50);
      setTimeout(() => clearInterval(check), 3000);
    },
    []
  );

  const goToStroke = useCallback(
    (targetIndex: number) => {
      const writer = writerRef.current;
      if (!writer) return;

      const total = getStrokeCount(writer) || strokes.length;

      if (writer._renderState) {
        const strokesState: Record<string, { opacity: number; displayPortion: number }> = {};
        for (let i = 0; i < total; i++) {
          strokesState[i] = {
            opacity: i <= targetIndex ? 1 : 0,
            displayPortion: i <= targetIndex ? 1 : 0,
          };
        }
        writer._renderState.updateState({
          character: {
            main: { strokes: strokesState },
            outline: { strokes: strokesState },
          },
        });
      }

      currentStrokeRef.current = targetIndex;
      setStrokeProgress({ current: targetIndex, total });
    },
    [strokes.length]
  );

  useEffect(() => {
    if (!char) {
      if (containerRef.current) containerRef.current.innerHTML = "";
      setStrokes([]);
      setMedians([]);
      setIsLoading(false);
      return;
    }

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    writerRef.current?.cancelQuiz?.();

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const data = await HanziWriter.loadCharacterData(char);
        if (cancelled) return;
        const strokePaths = data?.strokes ?? [];
        setStrokes(strokePaths);
        setMedians((data?.medians ?? []) as StrokePoint[][]);
        setIsLoading(false);

        if (mode === "auto") {
          animateSequential(char, strokePaths.length);
        } else {
          const writer = createWriter(char);
          if (!writer) {
            onErrorRef.current?.(char);
            return;
          }
          pollStrokeCount(writer, (n) => {
            currentStrokeRef.current = 0;
            setStrokeProgress({ current: 0, total: n });
          });
        }
      } catch {
        if (!cancelled) {
          setStrokes([]);
          setMedians([]);
          setIsLoading(false);
          onErrorRef.current?.(char);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [char, replayKey, mode, animateSequential, createWriter, pollStrokeCount]);

  const replay = useCallback(() => {
    if (!char) return;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    writerRef.current?.cancelQuiz?.();

    if (mode === "auto") {
      const total = strokesRef.current.length;
      if (total > 0) animateSequential(char, total);
    } else {
      const writer = createWriter(char);
      if (!writer) {
        onErrorRef.current?.(char);
        return;
      }
      pollStrokeCount(writer, (n) => {
        currentStrokeRef.current = 0;
        setStrokeProgress({ current: 0, total: n });
      });
    }
  }, [char, mode, animateSequential, createWriter, pollStrokeCount]);

  return {
    containerRef,
    isAnimating,
    isLoading,
    strokeProgress,
    strokes,
    medians,
    animateNextStroke,
    resetStrokes,
    replay,
    goToStroke,
  };
}