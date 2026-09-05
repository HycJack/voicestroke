import { useRef, useCallback, useEffect, useState } from "react";
import HanziWriter from "hanzi-writer";

export type PlayMode = "auto" | "step";

interface UseHanziWriterOptions {
  char: string | null;
  size: number;
  speed?: number;
  replayKey?: number;
  mode?: PlayMode;
  onComplete?: () => void;
  onError?: (char: string) => void;
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
}: UseHanziWriterOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriterInstance>(null);
  const currentStrokeRef = useRef(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [strokeProgress, setStrokeProgress] = useState({ current: 0, total: 0 });
  const [strokes, setStrokes] = useState<string[]>([]);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

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

  const loadStrokes = useCallback(async (target: string) => {
    try {
      const data = await HanziWriter.loadCharacterData(target);
      if (data && data.strokes) {
        setStrokes(data.strokes);
      }
    } catch {
      setStrokes([]);
    }
  }, []);

  const animateFull = useCallback(
    (target: string) => {
      const writer = createWriter(target);
      if (!writer) {
        onErrorRef.current?.(target);
        return;
      }
      setIsAnimating(true);
      writer.animateCharacter({
        onComplete: () => {
          setIsAnimating(false);
          onCompleteRef.current?.();
        },
      });
    },
    [createWriter]
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
      return;
    }

    loadStrokes(char);

    if (mode === "auto") {
      animateFull(char);
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
  }, [char, replayKey, mode, animateFull, createWriter, pollStrokeCount, loadStrokes]);

  const replay = useCallback(() => {
    if (!char) return;
    if (mode === "auto") {
      animateFull(char);
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
  }, [char, mode, animateFull, createWriter, pollStrokeCount]);

  return {
    containerRef,
    isAnimating,
    strokeProgress,
    strokes,
    animateNextStroke,
    resetStrokes,
    replay,
    goToStroke,
  };
}
