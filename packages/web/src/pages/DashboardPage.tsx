import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { qk } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth.store';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSpinner } from '@/components/ui/spinner';
import { OauBadge } from '@/components/branding/OauBadge';

const TERMS = [
  { value: '', label: 'All Terms' },
  { value: '202608', label: 'Harmattan 2025/2026' },
  { value: '202602', label: 'Rain 2025/2026' },
  { value: '202508', label: 'Harmattan 2024/2025' },
];

// OAU Batch years for footer display
const OAU_BATCH = '2025/2026';

export function DashboardPage() {
  const { isInstructor } = useAuthStore();
  const [termId, setTermId] = useState('');
  const [search, setSearch] = useState('');

  const {
    data: courses = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: qk.courses.list(termId),
    queryFn: () => api.courses.list(termId || undefined),
  });

  const filtered = courses.filter((c) =>
    search.trim()
      ? c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.courseCode.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* OAU Banner Header */}
      <header className="border-b border-slate-200 bg-gradient-to-b from-brand-600 to-brand-800 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OauBadge compact />
            <div>
              <h1 className="text-xl font-extrabold text-white">AtlasLMS</h1>
              <p className="text-sm text-slate-200">Obafemi Awolowo University</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200">Batch {OAU_BATCH}</span>
            <Badge variant="primary" className="text-xs">
              {OAU_BATCH}
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <TermSelector terms={TERMS} value={termId} onChange={setTermId} />
          </div>
          <div>
            <Search className="relative ml-auto w-56" />
            <input
              aria-label="Search courses"
              className="h-8 w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 placeholder-slate-400"
              placeholder="Search courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Course grid */}
        {isLoading && <PageSpinner />}

        {isError && (
          <div className="alert alert-error mb-6">
            Failed to load courses. Check your connection.
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto opacity-50 mb-3" />
            <p className="text-slate-500">No courses found.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Link
              key={course.id}
              to="/courses/$shellId"
              params={{ shellId: course.id }}
              className="group block rounded-lg overflow-hidden"
            >
              <Card className="h-full transition-shadow hover:shadow-card-hover">
                <CardBody className="flex flex-col gap-3 p-5">
                  {/* Header row */}
                  <div className="flex items-between justify-between">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                      <BookOpen className="h-4 w-4 text-brand-600" />
                    </div>
                    <div className="flex gap-1.5">
                      {course.isSandbox && (
                        <Badge variant="warning" className="text-xs">
                          Sandbox
                        </Badge>
                      )}
                      {course.isPublished ? (
                        <Badge variant="success" className="text-xs">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-xs">
                          Draft
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <p className="text-xs font-medium text-brand-600">
                      {course.courseCode}
                    </p>
                    <p className="mt-0.5 font-semibold text-slate-900 line-clamp-2">
                      {course.title}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
                    <span>{course.unitCode}</span>
                    <span className="capitalize">{course.gradeSystem} system</span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
          {!isInstructor() && courses.length === 0 && (
            <p className="col-span-2 text-center text-slate-400 py-8">
              No courses available
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

/* Term selector component */
function TermSelector({ terms, value, onChange }: { terms: Array<{ value: string; label: string }>; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <option value="">Select term</option>
        {terms.map((t) => (
          <option
            key={t.value}
            value={t.value}
          >
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}