import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/cn";

interface OauBadgeProps {
  compact?: boolean;
  className?: string;
}

export function OauBadge({ compact = false, className }: OauBadgeProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        aria-label="Obafemi Awolowo University"
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden border-2 border-oau-gold-400 bg-oau-blue-900 text-oau-gold-300 shadow-sm",
          compact ? "h-8 w-8 rounded-lg" : "h-14 w-14 rounded-2xl",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-1 border border-oau-gold-400/60",
            compact ? "rounded-md" : "rounded-xl",
          )}
        />
        <GraduationCap
          aria-hidden="true"
          className={cn("relative", compact ? "h-4 w-4" : "h-7 w-7")}
        />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-oau-gold-600">
            OAU
          </p>
          <p className="text-xs font-semibold text-oau-blue-900">
            Obafemi Awolowo University
          </p>
        </div>
      )}
    </div>
  );
}
