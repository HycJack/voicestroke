import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { CharBar } from "@/components/CharList/CharList";
import { StrokeCanvas } from "@/components/StrokeCanvas/StrokeCanvas";
import { StatusBar } from "@/components/StatusBar/StatusBar";
import { BottomPanel } from "@/components/BottomPanel/BottomPanel";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useHanziWriter, type PlayMode } from "@/hooks/useHanziWriter";
import { strokeNameFromMedians } from "@/utils/strokeName";
import { speakStrokeName, cancelStrokeVoice } from "@/utils/strokeSpeech";
import { useCharSupportCache } from "@/hooks/useCharSupportCache";
import { useFavorites } from "@/hooks/useFavorites";
import { extractChineseChars } from "@/utils/charExtractor";
import type { AppStatus } from "@/types";

const CANVAS_SIZE = 280;

export default function App() {
  const [recognizedChars, setRecognizedChars] = useState<string[]>([]);
  const [activeChar, setActiveChar] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [status, setStatus] = useState<AppStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("等待语音输入");
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState<PlayMode>("auto");
  // 笔顺语音跟读开关（localStorage 持久化）
  const [strokeVoiceOn, setStrokeVoiceOn] = useState(() => {
    try {
      return localStorage.getItem("vs-stroke-voice") !== "off";
    } catch {
      return true; // 隐私模式等存储不可用时默认开启
    }
  });

  const toggleStrokeVoice = useCallback(() => {
    setStrokeVoiceOn((v) => {
      const nv = !v;
      try {
        localStorage.setItem("vs-stroke-voice", nv ? "on" : "off");
      } catch {
        /* ignore */
      }
      return nv;
    });
  }, []);

  // 通过 ref 转发每笔回调，hook 拿到的是稳定引用（最新值在 render 中刷新）
  const strokeVoiceHandlerRef = useRef<(i: number) => void>(() => {});
  const handleStrokeStart = useCallback(
    (i: number) => strokeVoiceHandlerRef.current(i),
    []
  );

  const speech = useSpeechRecognition();
  const { markUnsupported, unsupported } = useCharSupportCache();
  const { favorites, toggle: toggleFavorite } = useFavorites();

  const handleAnimationComplete = useCallback(() => {
    setStatus("recognized");
    setStatusMessage("笔顺动画播放完成");
  }, []);

  const handleAnimationError = useCallback(
    (char: string) => {
      markUnsupported(char);
      setStatus("error");
      setStatusMessage(`「${char}」暂不支持笔顺动画`);
    },
    [markUnsupported]
  );

  const {
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
  } = useHanziWriter({
    char: activeChar,
    size: CANVAS_SIZE,
    speed,
    replayKey,
    mode,
    onComplete: handleAnimationComplete,
    onError: handleAnimationError,
    onStrokeStart: handleStrokeStart,
  });

  // render 期间刷新：拿到最新的 medians/strokes/开关状态
  strokeVoiceHandlerRef.current = (index: number) => {
    if (!strokeVoiceOn) return;
    const name = strokeNameFromMedians(medians[index], strokes[index]);
    if (name) speakStrokeName(name);
  };

  // 切换字时停止残留播报
  useEffect(() => {
    cancelStrokeVoice();
  }, [activeChar]);

  // 当前笔画名（step 模式显示）
  const currentStrokeName = useMemo(() => {
    const i = strokeProgress.current;
    if (!activeChar || i <= 0 || i > strokes.length) return null;
    return strokeNameFromMedians(medians[i - 1], strokes[i - 1]) ?? null;
  }, [activeChar, strokeProgress.current, strokes, medians]);

  const processTranscript = useCallback((text: string) => {
    const chars = extractChineseChars(text);
    if (chars.length === 0) {
      setStatus("error");
      setStatusMessage("未检测到汉字，请说出中文词语");
      return;
    }
    setRecognizedChars(chars);
    setStatus("recognized");
    setStatusMessage(`识别到 ${chars.length} 个汉字`);
    setActiveChar(null);
  }, []);

  useEffect(() => {
    if (speech.transcript) processTranscript(speech.transcript);
  }, [speech.transcript, processTranscript]);

  useEffect(() => {
    if (speech.isRecording) {
      setStatus("listening");
      setStatusMessage("正在聆听...");
    }
  }, [speech.isRecording]);

  useEffect(() => {
    if (speech.error) {
      setStatus("error");
      setStatusMessage(speech.error);
    }
  }, [speech.error]);

  const handleSelectChar = useCallback(
    (char: string) => {
      if (unsupported.has(char)) return;
      if (char === activeChar) {
        setReplayKey((k) => k + 1);
      } else {
        setActiveChar(char);
      }
      setStatus("playing");
      setStatusMessage(
        mode === "step"
          ? `逐笔练习「${char}」`
          : `正在书写「${char}」`
      );
    },
    [activeChar, unsupported, mode]
  );

  const handleReplay = useCallback(() => {
    if (activeChar) {
      replay();
      setStatus("playing");
      setStatusMessage(`正在书写「${activeChar}」`);
    }
  }, [activeChar, replay]);

  const handleNextStroke = useCallback(() => {
    animateNextStroke();
    setStatus("playing");
    if (activeChar) {
      setStatusMessage(`逐笔练习「${activeChar}」`);
    }
  }, [animateNextStroke, activeChar]);

  const handleResetStrokes = useCallback(() => {
    resetStrokes();
    if (activeChar) {
      setStatusMessage(`重新开始「${activeChar}」`);
    }
  }, [resetStrokes, activeChar]);

  const handleSelectStroke = useCallback(
    (index: number) => {
      goToStroke(index);
      setStatus("playing");
      if (activeChar) {
        setStatusMessage(`跳转到「${activeChar}」第 ${index + 1} 笔`);
      }
    },
    [goToStroke, activeChar]
  );

  const handleClear = useCallback(() => {
    setRecognizedChars([]);
    setActiveChar(null);
    setReplayKey(0);
    setStatus("idle");
    setStatusMessage("等待语音输入");
  }, []);

  const handleManualSubmit = useCallback(
    (text: string) => processTranscript(text),
    [processTranscript]
  );

  const charListMemo = useMemo(() => recognizedChars, [recognizedChars]);

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-background">
      {/* header */}
      <header className="shrink-0 text-center pt-4 pb-1">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          VoiceStroke
        </h1>
        <p className="text-xs text-muted-foreground/60">
          语音输入 · 笔顺演示
        </p>
      </header>

      {/* status */}
      <div className="shrink-0">
        <StatusBar status={status} message={statusMessage} />
      </div>

      {/* main canvas area */}
      <StrokeCanvas
        activeChar={activeChar}
        isAnimating={isAnimating}
        isLoading={isLoading}
        mode={mode}
        strokeProgress={strokeProgress}
        strokes={strokes}
        containerRef={containerRef}
        currentStrokeName={currentStrokeName}
        onReplay={handleReplay}
        onNextStroke={handleNextStroke}
        onResetStrokes={handleResetStrokes}
        onSelectStroke={handleSelectStroke}
      />

      {/* char bar */}
      <div className="shrink-0 overflow-y-auto max-h-40 py-2">
        <CharBar
          chars={charListMemo}
          activeChar={activeChar}
          unsupported={unsupported}
          favorites={favorites}
          onSelect={handleSelectChar}
          onToggleFavorite={toggleFavorite}
          onClear={handleClear}
        />
      </div>

      {/* bottom input */}
      <div className="shrink-0">
        <BottomPanel
          isRecording={speech.isRecording}
          isSupported={speech.isSupported}
          interimTranscript={speech.interimTranscript}
          speed={speed}
          mode={mode}
          strokeVoiceOn={strokeVoiceOn}
          onToggleStrokeVoice={toggleStrokeVoice}
          onStartRecord={speech.start}
          onStopRecord={speech.stop}
          onManualSubmit={handleManualSubmit}
          onSpeedChange={setSpeed}
          onModeChange={setMode}
        />
      </div>
    </div>
  );
}
