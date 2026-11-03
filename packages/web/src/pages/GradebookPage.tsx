import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { Table, Thead, Th, Tbody, Tr, Td } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageSpinner } from "@/components/ui/spinner";

export function GradebookPage() {
  const navigate = useNavigate();
  const { shellId } = useParams({ strict: false });
  const { user, isInstructor, isStudent } = useAuthStore();

  // Only instructors and students can view the gradebook
  if (!isInstructor() && !isStudent()) {
    return null;
  }

  const {
    data: finalGrades = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["gradebook", shellId],
    queryFn: () => api.gradebook.calculate(shellId!),
    enabled: !!shellId,
  });

  // If student, only show their own grade
  const grades =
    isStudent() && user
      ? finalGrades.filter((g) => g.orgDefinedId === user.orgDefinedId)
      : finalGrades;

  const rowClass = (i: number) => {
    if (i % 2 === 0) return "bg-white";
    return "bg-slate-50";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* OAU Header */}
      <header className="border-b border-slate-200 bg-gradient-to-b from-brand-600 to-brand-800 p-6 max-w-7xl mx-auto">
        <div className="flex items-center">
          <div className="flex h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <span className="text-xl font-bold text-brand-600">OAU</span>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white ml-3">
              Gradebook
            </h1>
            <p className="text-sm text-slate-200">Obafemi Awolowo University</p>
          </div>
        </div>
      </header>
      {shellId && (
        <nav className="my-4 flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate({ to: "/dashboard" })}
          >
            Back
          </Button>
        </nav>
      )}

      <main className="flex-1 p-6">
        {/* Course shell info */}
        {shellId && (
          <div className="alert alert-info mb-6">
            <span className="font-medium">Course Shell:</span> Shell {shellId}
          </div>
        )}

        {/* Persist button (instructors only) */}
        {isInstructor() && (
          <div className="mb-6">
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                api.gradebook
                  .persist(shellId!)
                  .then(() => window.alert("Grades persisted!"))
              }
            >
              Persist Final Grades
            </Button>
          </div>
        )}

        {isLoading && <PageSpinner />}

        {isError && (
          <div className="alert alert-error mb-6">
            Failed to load grades. Check your connection.
          </div>
        )}

        {!isLoading && grades.length > 0 && (
          <div className="overflow-x-auto rounded-lg overflow-hidden">
            <Table>
              <Thead>
                <Tr>
                  <Th>Student</Th>
                  <Th>Org Defined ID</Th>
                  <Th>Calculated Grade</Th>
                  <Th>Letter Grade</Th>
                </Tr>
              </Thead>
              <Tbody>
                {grades.map((g, i) => (
                  <Tr key={g.studentId} className={rowClass(i)}>
                    <Td className="font-medium">
                      {g.firstName} {g.lastName}
                    </Td>
                    <Td>{g.orgDefinedId}</Td>
                    <Td>{g.calculatedNumeric}</Td>
                    <Td>
                      {g.calculatedNumeric >= 93
                        ? "A"
                        : g.calculatedNumeric >= 90
                          ? "A-"
                          : g.calculatedNumeric >= 87
                            ? "B+"
                            : g.calculatedNumeric >= 83
                              ? "B"
                              : g.calculatedNumeric >= 80
                                ? "B-"
                                : g.calculatedNumeric >= 77
                                  ? "C+"
                                  : g.calculatedNumeric >= 73
                                    ? "C"
                                    : g.calculatedNumeric >= 70
                                      ? "C-"
                                      : g.calculatedNumeric >= 60
                                        ? "D"
                                        : "F"}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </div>
        )}

        {!isLoading && grades.length === 0 && (
          <div className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto opacity-50 mb-4" />
            <p>No grades found for this course.</p>
          </div>
        )}
      </main>
    </div>
  );
}
