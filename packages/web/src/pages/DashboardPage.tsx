import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search } from "lucide-react";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth.store";
import { TopBar } from "@/components/layout/TopBar";

const TERMS = [
  { value: "",       label: "All terms" },
  { value: "202608", label: "Harmattan 2025 / 2026" },
  { value: "202602", label: "Rain 2025 / 2026" },
  { value: "202508", label: "Harmattan 2024 / 2025" },
];

export function DashboardPage() {
  const { user, isInstructor } = useAuthStore();
  const [termId, setTermId]   = useState("");
  const [search, setSearch]   = useState("");

  const {
    data: courses = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: qk.courses.list(termId),
    queryFn:  () => api.courses.list(termId || undefined),
  });

  const filtered = courses.filter((c) =>
    search.trim()
      ? c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.courseCode.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  const greeting = user
    ? `Welcome back, ${user.firstName}`
    : "Dashboard";

  return (
    <>
      <TopBar
        title={greeting}
        subtitle={user ? `${user.role} · OAU eLearning` : undefined}
      />

      <div className="px-8 py-8" style={{ maxWidth: 1200 }}>

        {/* ── Filter bar ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Term selector */}
          <div className="relative">
            <select
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              className="field-input pl-3 pr-8"
              style={{ width: 220, backgroundImage: "none" }}
            >
              {TERMS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
              style={{ color: "var(--stone-500)" }}
            />
            <input
              aria-label="Search courses"
              className="field-input pl-9"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── States ──────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <span className="spinner-ring" />
          </div>
        )}

        {isError && (
          <div className="alert alert-error mb-6">
            Failed to load courses. Check your connection.
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <BookOpen className="h-10 w-10 mb-3" style={{ color: "var(--stone-300)" }} />
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
              {search ? "No courses match your search." : "No courses found for this term."}
            </p>
          </div>
        )}

        {/* ── Course grid ─────────────────────────────────────────────────── */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <Link
                key={course.id}
                to="/courses/$shellId"
                params={{ shellId: course.id }}
                className="block"
                style={{ textDecoration: "none" }}
              >
                <article
                  className="card h-full flex flex-col cursor-pointer"
                  style={{ padding: 0 }}
                >
                  {/* Gold top accent bar */}
                  <div
                    style={{
                      height: 3,
                      background: "var(--gold-500, #b8922a)",
                      borderRadius: "var(--r-lg, 16px) var(--r-lg, 16px) 0 0",
                    }}
                  />

                  <div className="flex flex-col gap-3 p-5 flex-1">
                    {/* Course code + status */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-medium uppercase tracking-wider"
                        style={{ color: "var(--gold-700, #8a6a1a)" }}
                      >
                        {course.courseCode}
                      </span>
                      <span
                        className={`badge ${course.isPublished ? "badge-success" : "badge-default"}`}
                      >
                        {course.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className="text-base font-normal leading-snug line-clamp-2"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        color: "var(--ink)",
                      }}
                    >
                      {course.title}
                    </h3>

                    {/* Meta */}
                    <div
                      className="mt-auto flex items-center justify-between text-xs pt-3"
                      style={{
                        borderTop: "1px solid var(--hairline)",
                        color: "var(--ink-muted)",
                      }}
                    >
                      <span>{course.unitCode ?? "—"}</span>
                      <span className="capitalize">{course.gradeSystem} grading</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {!isInstructor() && courses.length === 0 && !isLoading && (
          <p className="text-sm text-center py-8" style={{ color: "var(--stone-500)" }}>
            No courses available.
          </p>
        )}
      </div>
    </>
  );
}
