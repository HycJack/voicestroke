import type { AppStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  status: AppStatus;
  message: string;
}

const dotColor: Record<AppStatus, string> = {
  idle: "bg-muted-foreground/30",
  listening: "bg-destructive animate-pulse",
  recognized: "bg-success",
  playing: "bg-primary animate-pulse",
  error: "bg-warning",
};

export function StatusBar({ status, message }: StatusBarProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-2 px-4 text-sm text-muted-foreground">
      <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor[status])} />
      <span className="truncate">{message}</span>
    </div>
  );
}
