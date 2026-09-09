import { cn } from "@/lib/utils";

interface CharBarProps {
  chars: string[];
  activeChar: string | null;
  unsupported: Set<string>;
  favorites: string[];
  onSelect: (char: string) => void;
  onToggleFavorite: (char: string) => void;
  onClear: () => void;
}

export function CharBar({
  chars,
  activeChar,
  unsupported,
  favorites,
  onSelect,
  onToggleFavorite,
  onClear,
}: CharBarProps) {
  if (chars.length === 0 && favorites.length === 0) return null;

  return (
    <div className="w-full px-4 space-y-3">
      {/* recognized chars */}
      {chars.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              识别结果
            </span>
            <button
              onClick={onClear}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              清空
            </button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {chars.map((char) => {
              const isUnsupported = unsupported.has(char);
              const isActive = char === activeChar && !isUnsupported;
              const isFav = favorites.includes(char);
              return (
                <div key={char} className="relative group">
                  <button
                    onClick={() => !isUnsupported && onSelect(char)}
                    disabled={isUnsupported}
                    aria-label={
                      isUnsupported ? `${char} 不支持笔顺` : `查看 ${char} 的笔顺`
                    }
                    className={cn(
                      "w-12 h-12 rounded-xl text-xl font-semibold border-2 transition-all duration-150 flex items-center justify-center select-none font-kai",
                      isActive
                        ? "border-primary bg-primary-light text-primary shadow-sm shadow-primary/20 scale-105"
                        : isUnsupported
                        ? "border-border bg-muted text-muted-foreground/40 line-through cursor-not-allowed"
                        : "border-border bg-card hover:border-primary/60 hover:scale-105 active:scale-95"
                    )}
                    title={
                      isUnsupported
                        ? `${char} 不支持笔顺`
                        : `查看 ${char} 的笔顺`
                    }
                  >
                    {char}
                  </button>
                  {/* favorite star — hover 设备上悬停才显示，触屏始终可见 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(char);
                    }}
                    aria-label={isFav ? `取消收藏 ${char}` : `收藏 ${char}`}
                    aria-pressed={isFav}
                    className={cn(
                      "absolute -top-1 -right-1 rounded-full flex items-center justify-center text-sm transition-all",
                      "w-7 h-7",
                      /* 扩展热区到 ~44px，不改视觉尺寸 */
                      "after:content-[''] after:absolute after:-inset-2",
                      /* 触屏（无 hover）始终可见；鼠标设备悬停显示 */
                      "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100",
                      isFav
                        ? "opacity-100! bg-amber-400 text-white"
                        : "bg-card border border-border text-muted-foreground hover:text-amber-500"
                    )}
                    title={isFav ? "取消收藏" : "收藏"}
                  >
                    {isFav ? "★" : "☆"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* favorites */}
      {favorites.length > 0 && (
        <div>
          <span className="text-xs font-medium text-amber-600 uppercase tracking-wide flex items-center gap-1">
            ★ 常用收藏
          </span>
          <div className="flex flex-wrap gap-2 justify-center mt-1.5">
            {favorites.map((char) => {
              const isUnsupported = unsupported.has(char);
              const isActive = char === activeChar;
              return (
                <button
                  key={`fav-${char}`}
                  onClick={() => !isUnsupported && onSelect(char)}
                  disabled={isUnsupported}
                  aria-label={`打开 ${char} 的笔顺`}
                  className={cn(
                    "w-11 h-11 rounded-lg text-lg font-semibold border-2 transition-all duration-150 flex items-center justify-center select-none font-kai",
                    isActive
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : isUnsupported
                      ? "border-border bg-muted text-muted-foreground/40 line-through cursor-not-allowed"
                      : "border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:scale-105 active:scale-95"
                  )}
                >
                  {char}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
