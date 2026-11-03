import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  LayoutDashboard,
  BarChart2,
  ArrowLeftRight,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth.store";
import { OauBadge } from "@/components/branding/OauBadge";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  { to: "/courses", label: "Courses", icon: <BookOpen className="h-4 w-4" /> },
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
    <aside className="flex h-full w-56 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-4">
        <OauBadge compact />
        <div className="min-w-0 leading-tight">
          <span className="block truncate font-semibold tracking-tight text-slate-900">
            AtlasLMS
          </span>
          <span className="block truncate text-[0.65rem] font-medium uppercase tracking-[0.12em] text-oau-gold-600">
            OAU eLearning
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3" aria-label="Main navigation">
        <ul className="space-y-0.5 px-2">
          {visible.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                activeProps={{ className: "bg-brand-50 text-brand-700" }}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      {user && (
        <div className="border-t border-slate-100 px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-slate-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-slate-500">{user.role}</p>
            </div>
          </div>
          <button
            onClick={clearSession}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
