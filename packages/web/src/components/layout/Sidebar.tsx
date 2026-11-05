import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  LayoutDashboard,
  BarChart2,
  ArrowLeftRight,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth.store";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard",  icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/courses",   label: "Courses",    icon: <BookOpen className="h-4 w-4" /> },
  {
    to: "/gradebook",
    label: "Gradebook",
    icon: <BarChart2 className="h-4 w-4" />,
    roles: ["Instructor", "TA", "SystemAdmin"],
  },
  {
    to: "/crosslist",
    label: "Cross-list",
    icon: <ArrowLeftRight className="h-4 w-4" />,
    roles: ["Instructor", "SystemAdmin"],
  },
  {
    to: "/my-grades",
    label: "My Grades",
    icon: <GraduationCap className="h-4 w-4" />,
    roles: ["Student"],
  },
];

export function Sidebar() {
  const { user, clearSession } = useAuthStore();

  const visible = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <aside
      className="flex h-full flex-col"
      style={{
        width: "var(--sidebar-w, 224px)",
        background: "#ffffff",
        borderRight: "1px solid var(--hairline, #e0dbd3)",
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5"
        style={{
          height: "var(--nav-h, 60px)",
          borderBottom: "1px solid var(--hairline, #e0dbd3)",
        }}
      >
        {/* Hex mark */}
        <svg
          aria-hidden="true"
          width="30"
          height="30"
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <polygon
            points="22,2 40,12 40,32 22,42 4,32 4,12"
            fill="#0f1c3a"
            stroke="#b8922a"
            strokeWidth="1.5"
          />
          <polygon
            points="22,7 35,14.5 35,29.5 22,37 9,29.5 9,14.5"
            fill="none"
            stroke="#b8922a"
            strokeWidth="0.75"
            opacity="0.55"
          />
          <text
            x="22" y="27"
            textAnchor="middle"
            fontSize="12"
            fontFamily="'Playfair Display', Georgia, serif"
            fill="#d4a843"
          >
            Ω
          </text>
        </svg>

        <div className="min-w-0 leading-tight">
          <span
            className="block truncate text-sm font-normal text-navy-900"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            AtlasLMS
          </span>
          <span
            className="block truncate text-[10px] font-medium uppercase tracking-[0.16em] text-gold-500"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            OAU eLearning
          </span>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav
        className="flex-1 overflow-y-auto py-4"
        aria-label="Main navigation"
      >
        <ul className="space-y-0.5 px-3">
          {visible.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="nav-link"
                activeProps={{ className: "nav-link active" }}
              >
                <span
                  className="shrink-0"
                  style={{ color: "var(--ink-muted, #4a4540)" }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Gold hairline divider */}
        <div
          className="mx-5 mt-6 mb-1"
          style={{ height: "1px", background: "var(--hairline, #e0dbd3)" }}
          aria-hidden="true"
        />
      </nav>

      {/* ── User footer ───────────────────────────────────────────────────── */}
      {user && (
        <div
          className="px-3 py-3"
          style={{ borderTop: "1px solid var(--hairline, #e0dbd3)" }}
        >
          {/* Avatar row */}
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white select-none"
              style={{ background: "var(--navy-700, #1a3260)" }}
            >
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium" style={{ color: "var(--ink)" }}>
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[11px]" style={{ color: "var(--ink-muted)" }}>
                {user.role}
              </p>
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={clearSession}
            className={cn(
              "mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-1.5",
              "text-xs transition-colors duration-100",
            )}
            style={{ color: "var(--ink-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-alt)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-muted)";
            }}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
