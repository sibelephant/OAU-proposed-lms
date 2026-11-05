import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ChevronLeft, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { TopBar } from "@/components/layout/TopBar";

function letterGrade(score: number): string {
  if (score >= 93) return "A";
  if (score >= 90) return "A−";
  if (score >= 87) return "B+";
  if (score >= 83) return "B";
  if (score >= 80) return "B−";
  if (score >= 77) return "C+";
  if (score >= 73) return "C";
  if (score >= 70) return "C−";
  if (score >= 60) return "D";
  return "F";
}

function gradeColor(letter: string) {
  if (letter.startsWith("A")) return { color: "#1d6c37" };
  if (letter.startsWith("B")) return { color: "var(--navy-700, #1a3260)" };
  if (letter.startsWith("C")) return { color: "var(--gold-700, #8a6a1a)" };
  return { color: "#991b1b" };
}

export function GradebookPage() {
  const navigate = useNavigate();
  const { shellId } = useParams({ strict: false });
  const { user, isInstructor, isStudent } = useAuthStore();

  if (!isInstructor() && !isStudent()) return null;

  const {
    data: finalGrades = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["gradebook", shellId],
    queryFn:  () => api.gradebook.calculate(shellId!),
    enabled:  !!shellId,
  });

  const grades =
    isStudent() && user
      ? finalGrades.filter((g) => g.orgDefinedId === user.orgDefinedId)
      : finalGrades;

  return (
    <>
      <TopBar
        title="Gradebook"
        subtitle={shellId ? `Course shell ${shellId}` : "Select a course"}
        actions={
          shellId && (
            <button
              className="btn btn-secondary btn-sm flex items-center gap-1"
              onClick={() => navigate({ to: "/dashboard" })}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
          )
        }
      />

      <div className="px-8 py-8" style={{ maxWidth: 1200 }}>

        {/* Persist button (instructors only) */}
        {isInstructor() && shellId && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
              {grades.length} student{grades.length !== 1 ? "s" : ""}
            </p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() =>
                api.gradebook
                  .persist(shellId)
                  .then(() => alert("Final grades persisted."))
              }
            >
              Persist final grades
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <span className="spinner-ring" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="alert alert-error mb-6">
            Failed to load grades. Check your connection.
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && grades.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <BookOpen className="h-10 w-10 mb-3" style={{ color: "var(--stone-300)" }} />
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
              No grades found for this course.
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoading && grades.length > 0 && (
          <div
            className="overflow-hidden"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--r-lg, 16px)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 24 }}>Student</th>
                    <th>Org ID</th>
                    <th>Score</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((g, i) => {
                    const letter = letterGrade(Number(g.calculatedNumeric));
                    return (
                      <tr
                        key={g.studentId}
                        style={{
                          background: i % 2 === 0
                            ? "var(--bg-surface)"
                            : "var(--stone-050, #f6f2ec)",
                        }}
                      >
                        <td
                          style={{ paddingLeft: 24, fontWeight: 500, color: "var(--ink)" }}
                        >
                          {g.firstName} {g.lastName}
                        </td>
                        <td style={{ color: "var(--ink-muted)", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                          {g.orgDefinedId}
                        </td>
                        <td style={{ color: "var(--ink)" }}>
                          {Number(g.calculatedNumeric).toFixed(1)}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              ...gradeColor(letter),
                              background: letter.startsWith("A")
                                ? "#e6f4ea"
                                : letter.startsWith("B")
                                  ? "var(--navy-050)"
                                  : letter.startsWith("C")
                                    ? "var(--gold-100)"
                                    : "#fef2f2",
                              fontWeight: 600,
                              fontSize: 12,
                            }}
                          >
                            {letter}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div
              className="flex items-center justify-between px-6 py-3 text-xs"
              style={{
                borderTop: "1px solid var(--hairline)",
                background: "var(--bg-alt, #ede8e0)",
                color: "var(--ink-muted)",
                borderRadius: "0 0 var(--r-lg, 16px) var(--r-lg, 16px)",
              }}
            >
              <span>{grades.length} records</span>
              {grades.length > 0 && (
                <span>
                  Class avg{" "}
                  <strong style={{ color: "var(--ink)" }}>
                    {(
                      grades.reduce((sum, g) => sum + Number(g.calculatedNumeric), 0) /
                      grades.length
                    ).toFixed(1)}
                  </strong>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
