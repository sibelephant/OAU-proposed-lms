import { cn } from "@/lib/cn";

interface OauBadgeProps {
  compact?: boolean;
  className?: string;
  /** Inverse: white mark on navy, used in the sidebar header */
  inverse?: boolean;
}

/**
 * OAU institutional mark.
 *
 * Full  — hexagonal crest with laurel lines and the "OAU" initial.
 * Compact — square badge with the initial only.
 */
export function OauBadge({ compact = false, inverse = false, className }: OauBadgeProps) {
  if (compact) {
    return (
      <div
        aria-label="Obafemi Awolowo University"
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md font-display text-sm font-normal leading-none select-none",
          inverse
            ? "bg-navy-900 text-gold-400 ring-1 ring-gold-500/40"
            : "bg-navy-900 text-gold-400 ring-1 ring-gold-500/40",
          className,
        )}
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
      >
        Ω
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      {/* Hexagonal crest */}
      <svg
        aria-hidden="true"
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Hex background */}
        <polygon
          points="22,2 40,12 40,32 22,42 4,32 4,12"
          fill="#0f1c3a"
          stroke="#b8922a"
          strokeWidth="1.5"
        />
        {/* Inner hex ring */}
        <polygon
          points="22,7 35,14.5 35,29.5 22,37 9,29.5 9,14.5"
          fill="none"
          stroke="#b8922a"
          strokeWidth="0.75"
          opacity="0.6"
        />
        {/* Laurel lines */}
        <line x1="13" y1="20" x2="17" y2="20" stroke="#b8922a" strokeWidth="0.8" opacity="0.7" />
        <line x1="13" y1="23" x2="17" y2="23" stroke="#b8922a" strokeWidth="0.8" opacity="0.7" />
        <line x1="27" y1="20" x2="31" y2="20" stroke="#b8922a" strokeWidth="0.8" opacity="0.7" />
        <line x1="27" y1="23" x2="31" y2="23" stroke="#b8922a" strokeWidth="0.8" opacity="0.7" />
        {/* OAU initial */}
        <text
          x="22"
          y="26"
          textAnchor="middle"
          fontSize="11"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="400"
          fill="#d4a843"
          letterSpacing="-0.3"
        >
          OAU
        </text>
      </svg>

      {/* Wordmark */}
      <div className="leading-tight select-none">
        <p
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold-500"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          AtlasLMS
        </p>
        <p
          className="text-sm text-navy-900"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 400 }}
        >
          Obafemi Awolowo University
        </p>
      </div>
    </div>
  );
}
