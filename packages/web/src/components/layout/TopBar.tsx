import { Bell } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header
      className="flex shrink-0 items-center justify-between px-8"
      style={{
        height: "var(--nav-h, 60px)",
        background: "#ffffff",
        borderBottom: "1px solid var(--hairline, #e0dbd3)",
      }}
    >
      {/* Title */}
      <div>
        <h1
          className="text-xl font-normal leading-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: "var(--ink)",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {actions}

        <button
          aria-label="Notifications"
          className="btn btn-ghost btn-icon"
          style={{ color: "var(--ink-muted)" }}
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
