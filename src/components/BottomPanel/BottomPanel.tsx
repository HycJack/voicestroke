import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import type { PlayMode } from "@/hooks/useHanziWriter";

interface BottomPanelProps {
  isRecording: boolean;
  isSupported: boolean;
  interimTranscript: string;
  speed: number;
  mode: PlayMode;
  strokeVoiceOn: boolean;
  onToggleStrokeVoice: () => void;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onManualSubmit: (text: string) => void;
  onSpeedChange: (speed: number) => void;
  onModeChange: (mode: PlayMode) => void;
}

export function BottomPanel({
  isRecording,
  isSupported,
  interimTranscript,
  speed,
  mode,
  strokeVoiceOn,
  onToggleStrokeVoice,
  onStartRecord,
  onStopRecord,
  onManualSubmit,
  onSpeedChange,
  onModeChange,
}: BottomPanelProps) {
  const [manualText, setManualText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      onManualSubmit(manualText.trim());
      setManualText("");
    }
  };

  return (
    <div className="w-full border-t border-border bg-card/80 backdrop-blur-sm px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      {/* interim transcript */}
      {interimTranscript && (
        <div className="text-xs text-muted-foreground text-center mb-2 italic truncate px-4">
          {interimTranscript}
        </div>
      )}

      {/* mode toggle + speed + 跟读 */}
      <div className="flex items-center justify-between mb-2.5">
        {/* mode toggle */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => onModeChange("auto")}
            className={cn(
              "px-3 py-1 text-xs font-medium transition-all",
              mode === "auto"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            自动播放
          </button>
          <button
            onClick={() => onModeChange("step")}
            className={cn(
              "px-3 py-1 text-xs font-medium transition-all",
              mode === "step"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            逐笔练习
          </button>
        </div>

        {/* 语音跟读开关 */}
        <button
          onClick={onToggleStrokeVoice}
          aria-pressed={strokeVoiceOn}
          aria-label={strokeVoiceOn ? "关闭笔顺语音跟读" : "开启笔顺语音跟读"}
          title={strokeVoiceOn ? "关闭笔顺语音跟读" : "开启笔顺语音跟读"}
          className={cn(
            "shrink-0 w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-95",
            strokeVoiceOn
              ? "bg-primary-light text-primary border-primary/50"
              : "bg-card text-muted-foreground border-border"
          )}
        >
          {strokeVoiceOn ? (
            <svg
              className="w-4.5 h-4.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 5 6 9H2v6h4l5 4z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M19 5a9 9 0 0 1 0 14" />
            </svg>
          ) : (
            <svg
              className="w-4.5 h-4.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 5 6 9H2v6h4l5 4z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>

        {/* speed */}
        <label className="text-xs text-muted-foreground flex items-center gap-2">
          速度
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.25}
            value={speed}
            aria-label="动画速度"
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-24 accent-primary h-6 cursor-pointer"
          />
          <span className="text-xs font-semibold text-primary w-8 text-right">
            {speed}x
          </span>
        </label>
      </div>

      {/* main input row */}
      <div className="flex items-center gap-2">
        {/* voice button */}
        <button
          onClick={isRecording ? onStopRecord : onStartRecord}
          disabled={!isSupported}
          aria-label={
            !isSupported
              ? "浏览器不支持语音识别"
              : isRecording
              ? "停止录音"
              : "开始录音"
          }
          className={cn(
            "shrink-0 w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white text-lg transition-all active:scale-90",
            isRecording
              ? "bg-destructive shadow-lg shadow-destructive/30 animate-pulse"
              : isSupported
              ? "bg-primary hover:bg-primary/90 shadow-md shadow-primary/20"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          title={
            !isSupported
              ? "浏览器不支持语音识别"
              : isRecording
              ? "停止录音"
              : "开始录音"
          }
        >
          {isRecording ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </button>

        {/* manual input */}
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
          <input
            type="text"
            inputMode="text"
            value={manualText}
            aria-label="手动输入汉字"
            onChange={(e) => setManualText(e.target.value)}
            placeholder="手动输入中文汉字..."
            className="flex-1 h-11 md:h-10 px-3 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-all"
          />
          <button
            type="submit"
            disabled={!manualText.trim()}
            className="shrink-0 h-11 md:h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            确认
          </button>
        </form>
      </div>
    </div>
  );
}
