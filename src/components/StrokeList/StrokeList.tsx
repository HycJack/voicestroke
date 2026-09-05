import { cn } from "@/lib/utils";

interface StrokeListProps {
  strokes: string[];
  currentStrokeIndex: number;
  onSelectStroke?: (index: number) => void;
}

export function StrokeList({
  strokes,
  currentStrokeIndex,
  onSelectStroke,
}: StrokeListProps) {
  if (strokes.length === 0) return null;

  return (
    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
      {strokes.map((_, index) => {
        const isCurrent = index === currentStrokeIndex;
        const isDone = index < currentStrokeIndex;

        return (
          <button
            key={index}
            onClick={() => onSelectStroke?.(index)}
            className={cn(
              "relative shrink-0 w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all",
              "hover:scale-105 active:scale-95",
              isCurrent
                ? "border-primary bg-primary-light shadow-sm shadow-primary/20"
                : isDone
                ? "border-success bg-success-light"
                : "border-border bg-card hover:border-primary/60"
            )}
            title={`第 ${index + 1} 笔`}
          >
            <svg viewBox="0 0 1024 1024" className="w-8 h-8">
              <g transform="translate(0, 1024) scale(1, -1)">
                {/* 渲染之前所有笔画作为背景 */}
                {strokes.slice(0, index + 1).map((strokePath, strokeIdx) => (
                  <path
                    key={strokeIdx}
                    d={strokePath}
                    fill={
                      strokeIdx === index
                        ? isCurrent
                          ? "#2563eb"
                          : isDone
                          ? "#16a34a"
                          : "#1e293b"
                        : "#d1d5db"
                    }
                  />
                ))}
              </g>
            </svg>

            {/* 序号标签 */}
            <span
              className={cn(
                "absolute -top-1 -left-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center",
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isDone
                  ? "bg-success text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </span>

            {/* 完成对勾 */}
            {isDone && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success text-white text-[9px] flex items-center justify-center">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
