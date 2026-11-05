import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { TopBar } from "@/components/layout/TopBar";

export function CoursesPage() {
  const navigate    = useNavigate();
  const { isInstructor } = useAuthStore();

  const {
    data: courses = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["courses"],
    queryFn:  () => api.courses.list(),
  });

  return (
    <>
      <TopBar
        title="Courses"
        subtitle="All course shells"
        actions={
          isInstructor() && (
            <a href="/courses/new" className="btn btn-primary btn-sm flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New course
            </a>
          )
        }
      />

      <div className="px-8 py-8" style={{ maxWidth: 1200 }}>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <span className="spinner-ring" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="alert alert-error mb-6">
            Failed to load courses. Check your connection.
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && courses.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <BookOpen className="h-10 w-10 mb-3" style={{ color: "var(--stone-300)" }} />
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
              No courses found.
            </p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && courses.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
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
                  {/* Gold accent bar */}
                  <div
                    style={{
                      height: 3,
                      background: "var(--gold-500, #b8922a)",
                      borderRadius: "var(--r-lg, 16px) var(--r-lg, 16px) 0 0",
                    }}
                  />

                  <div className="flex flex-col gap-3 p-5 flex-1">
                    {/* Code + status badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-xs font-medium uppercase tracking-wider"
                        style={{ color: "var(--gold-700)" }}
                      >
                        {course.courseCode}
                      </span>
                      <div className="flex gap-1.5">
                        {course.isSandbox && (
                          <span className="badge badge-warning">Sandbox</span>
                        )}
                        <span
                          className={`badge ${course.isPublished ? "badge-success" : "badge-default"}`}
                        >
                          {course.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      className="text-base font-normal leading-snug line-clamp-2 flex-1"
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        color: "var(--ink)",
                      }}
                    >
                      {course.title}
                    </h3>

                    {/* Meta + action */}
                    <div
                      className="flex items-center justify-between pt-3 text-xs"
                      style={{
                        borderTop: "1px solid var(--hairline)",
                        color: "var(--ink-muted)",
                      }}
                    >
                      <span>{course.unitCode ?? "—"} · {course.gradeSystem}</span>
                      <button
                        className="btn btn-ghost btn-sm px-2"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate({ to: "/courses/$shellId", params: { shellId: course.id } });
                        }}
                        style={{ fontSize: 12, color: "var(--accent)" }}
                      >
                        Open →
                      </button>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
