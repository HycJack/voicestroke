import { cn } from "@/lib/utils";
import type { PlayMode } from "@/hooks/useHanziWriter";
import { StrokeList } from "@/components/StrokeList/StrokeList";

interface StrokeCanvasProps {
  activeChar: string | null;
  isAnimating: boolean;
  mode: PlayMode;
  strokeProgress: { current: number; total: number };
  strokes: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  containerRef: React.RefObject<any>;
  onReplay?: () => void;
  onNextStroke?: () => void;
  onResetStrokes?: () => void;
  onSelectStroke?: (index: number) => void;
}

function RiceGrid() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 260 260"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* outer border */}
      <rect
        x={1}
        y={1}
        width={258}
        height={258}
        fill="none"
        stroke="#cbd5e1"
        strokeWidth={2}
      />
      {/* horizontal center */}
      <line
        x1={0}
        y1={130}
        x2={260}
        y2={130}
        stroke="#e2e8f0"
        strokeWidth={1}
        strokeDasharray="6 4"
      />
      {/* vertical center */}
      <line
        x1={130}
        y1={0}
        x2={130}
        y2={260}
        stroke="#e2e8f0"
        strokeWidth={1}
        strokeDasharray="6 4"
      />
      {/* diagonal: top-left to bottom-right */}
      <line
        x1={0}
        y1={0}
        x2={260}
        y2={260}
        stroke="#e2e8f0"
        strokeWidth={1}
        strokeDasharray="6 4"
      />
      {/* diagonal: top-right to bottom-left */}
      <line
        x1={260}
        y1={0}
        x2={0}
        y2={260}
        stroke="#e2e8f0"
        strokeWidth={1}
        strokeDasharray="6 4"
      />
    </svg>
  );
}

export function StrokeCanvas({
  activeChar,
  isAnimating,
  mode,
  strokeProgress,
  strokes,
  containerRef,
  onReplay,
  onNextStroke,
  onResetStrokes,
  onSelectStroke,
}: StrokeCanvasProps) {
  const allDone =
    mode === "step" &&
    strokeProgress.total > 0 &&
    strokeProgress.current >= strokeProgress.total;

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start justify-center flex-1 min-h-0 px-4 pt-2 pb-2 gap-4">
      {/* main canvas area */}
      <div className="flex flex-col items-center">
        {/* active char display */}
        <div className="h-12 md:h-14 flex items-center justify-center">
          {activeChar ? (
            <span className="text-4xl md:text-5xl font-bold tracking-tight text-foreground select-none">
              {activeChar}
            </span>
          ) : (
            <span className="text-sm md:text-base text-muted-foreground/60">
              语音或手动输入汉字
            </span>
          )}
        </div>

        {/* canvas with 米字格 - responsive */}
        <div
          className={cn(
            "relative mt-2 rounded-2xl border-2 bg-card shadow-sm transition-all overflow-hidden",
            "flex items-center justify-center",
            "w-full max-w-[280px] aspect-square",
            activeChar ? "border-border" : "border-dashed border-border/60"
          )}
        >
          {/* rice grid background — always visible */}
          <div className="absolute inset-0 flex items-center justify-center">
            <RiceGrid />
          </div>

          {activeChar ? (
            <div ref={containerRef} className="relative z-10 w-full h-full" />
          ) : (
            <div className="relative z-10 flex flex-col items-center gap-2 text-muted-foreground/40">
              <svg
                className="w-10 h-10 md:w-12 md:h-12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span className="text-xs md:text-sm">点击下方汉字查看笔顺</span>
            </div>
          )}

          {isAnimating && (
            <div className="absolute top-2 right-2 z-20">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
          )}
        </div>

        {/* controls - touch friendly */}
        {activeChar && (
          <div className="mt-3 flex items-center gap-2">
            {mode === "auto" && !isAnimating && (
              <button
                onClick={onReplay}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] text-sm font-medium text-primary bg-primary-light rounded-full hover:bg-accent-light transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 105.64-11.36L1 10" />
                </svg>
                重播
              </button>
            )}

            {mode === "step" && (
              <>
                {strokeProgress.total > 0 && (
                  <span className="text-sm text-muted-foreground mr-1">
                    {strokeProgress.current}/{strokeProgress.total} 笔
                  </span>
                )}

                {!allDone ? (
                  <button
                    onClick={onNextStroke}
                    disabled={isAnimating}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-5 py-2 min-h-[44px] text-sm font-semibold rounded-full transition-all active:scale-95",
                      isAnimating
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20"
                    )}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    下一笔
                  </button>
                ) : (
                  <span className="text-sm text-success font-medium">书写完成!</span>
                )}

                <button
                  onClick={onResetStrokes}
                  className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] text-sm text-muted-foreground border border-border rounded-full hover:bg-muted transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  重置
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* stroke list - responsive */}
      {activeChar && mode === "step" && strokes.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            笔画列表
          </span>
          <StrokeList
            strokes={strokes}
            currentStrokeIndex={strokeProgress.current}
            onSelectStroke={onSelectStroke}
          />
        </div>
      )}
    </div>
  );
}
