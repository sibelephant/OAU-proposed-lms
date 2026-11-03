import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageSpinner } from '@/components/ui/spinner';
import { OauBadge } from '@/components/branding/OauBadge';

export function CoursesPage() {
  const navigate = useNavigate();
  const { isInstructor } = useAuthStore();

  const {
    data: courses = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.courses.list(),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* OAU Header */}
      <header className="border-b border-slate-200 bg-gradient-to-b from-brand-600 to-brand-800 p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OauBadge compact />
            <div>
              <h1 className="text-xl font-extrabold text-white">Courses</h1>
              <p className="text-sm text-slate-200">Manage your course shells</p>
            </div>
          </div>
          {isInstructor() && (
            <nav aria-label="Course navigation">
              <a
                href="/courses/new"
                className="btn btn-primary">
                New Course
              </a>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 p-6">
        {/* Statistics cards or empty state */}
        {isLoading && <PageSpinner />}

        {isError && (
          <div className="alert alert-error mb-6">
            Failed to load courses. Check your connection.
          </div>
        )}

        {!isLoading && courses.length === 0 && (
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto opacity-50 mb-4" />
            <p className="text-slate-500">No courses found.</p>
          </div>
        )}

        {/* Course grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              to="/courses/$shellId"
              params={{ shellId: course.id }}
              className="group block rounded-lg overflow-hidden hover:bg-slate-50"
            >
              <Card className="h-full">
                <CardBody className="flex flex-col gap-3 p-5">
                  {/* Course header */}
                  <div className="flex items-between justify-between">
                    <div>
                      <p className="text-xs font-medium text-brand-600">
                        {course.courseCode}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 line-clamp-2">
                        {course.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {course.isPublished ? (
                        <Badge variant="success" className="text-xs">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">
                          Draft
                        </Badge>
                      )}
                      {course.isSandbox && (
                        <Badge variant="warning" className="text-xs">
                          Sandbox
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Course details */}
                  <p className="text-sm text-slate-500">
                    {course.unitCode} · {course.gradeSystem} system
                  </p>

                  {/* Action button */}
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() =>
                      navigate({ to: "/courses/$shellId", params: { shellId: course.id } })
                    }
                  >
                    View Details
                  </Button>
                </CardBody>
              </Card>
            </Link>
          ))}
          {!isInstructor() && courses.length === 0 && (
            <p className="col-span-3 text-center text-slate-400 py-12">
              No courses available
            </p>
          )}
        </div>
      </main>
    </div>
  );
}