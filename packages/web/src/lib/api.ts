import axios, { type AxiosError } from 'axios';

// ─── Types mirrored from the API (no codegen needed — kept in sync manually) ──

export interface CourseShell {
  id: string;
  courseCode: string;
  title: string;
  isPublished: boolean;
  isSandbox: boolean;
  gradeSystem: 'weighted' | 'points' | 'formula';
  ungradedTreatment?: 'drop_ungraded' | 'treat_as_zero';
  termId: string | null;
  createdAt: string;
  academicUnitId?: string;
  unitName: string;
  unitCode: string;
  sections?: CourseSection[];
}

export interface CourseSection {
  id: string;
  sisSectionId: string;
  primaryShellId: string;
  originalShellId: string;
  sectionCode: string;
  crosslistedById: string | null;
  crosslistedAt: string | null;
}

export interface EnrollmentRow {
  id: string;
  userId: string;
  role: 'Student' | 'Instructor' | 'TA' | 'Designer' | 'Auditor';
  status: 'active' | 'dropped' | 'completed' | 'incomplete';
  isSisManaged: boolean;
  firstName: string;
  lastName: string;
  email: string;
  loginId: string;
  orgDefinedId: string;
}

export interface UserEnrollment {
  id: string;
  sectionId: string;
  role: string;
  status: string;
  isSisManaged: boolean;
  sectionCode: string;
  shellId: string;
  courseCode: string;
  courseTitle: string;
  termId: string | null;
}

export interface GradeCategory {
  id: string;
  shellId: string;
  name: string;
  weightPercent: string;
  dropLowestCount: number;
  sortOrder: number;
}

export interface GradeItem {
  id: string;
  shellId: string;
  categoryId: string | null;
  title: string;
  maxPoints: string;
  itemWeightPercent: string;
  isBonus: boolean;
  dueDate: string | null;
}

export interface StudentFinalGrade {
  studentId: string;
  orgDefinedId: string;
  username: string;
  firstName: string;
  lastName: string;
  calculatedNumeric: number;
  letterGrade: string;
  categoryBreakdown: Record<string, { score: number; weight: number; contribution: number }>;
}

export interface FinalCourseGrade {
  id: string;
  shellId: string;
  studentId: string;
  calculatedNumeric: string;
  adjustedNumeric: string | null;
  letterGradeScheme: string;
  isReleasedToStudent: boolean;
  postedToSisAt: string | null;
}

// ─── Axios instance ───────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('atlas_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to /login on 401
apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('atlas_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── API functions ────────────────────────────────────────────────────────────

// Courses
export const api = {
  courses: {
    list: (termId?: string) =>
      apiClient.get<{ data: CourseShell[] }>('/courses', { params: termId ? { termId } : {} }).then(r => r.data.data),

    get: (shellId: string) =>
      apiClient.get<{ data: CourseShell }>(`/courses/${shellId}`).then(r => r.data.data),

    create: (body: { academicUnitId: string; courseCode: string; title: string; termId?: string; isSandbox?: boolean; gradeSystem?: string; ungradedTreatment?: string }) =>
      apiClient.post<{ data: CourseShell }>('/courses', body).then(r => r.data.data),

    update: (shellId: string, body: Partial<CourseShell>) =>
      apiClient.patch<{ data: CourseShell }>(`/courses/${shellId}`, body).then(r => r.data.data),

    sections: (shellId: string) =>
      apiClient.get<{ data: CourseSection[] }>(`/courses/${shellId}/sections`).then(r => r.data.data),

    createSection: (shellId: string, body: { sisSectionId: string; sectionCode: string }) =>
      apiClient.post<{ data: CourseSection }>(`/courses/${shellId}/sections`, body).then(r => r.data.data),
  },

  enrollments: {
    bySection: (sectionId: string) =>
      apiClient.get<{ data: EnrollmentRow[] }>(`/enrollments/sections/${sectionId}`).then(r => r.data.data),

    byUser: (userId: string) =>
      apiClient.get<{ data: UserEnrollment[] }>(`/enrollments/users/${userId}`).then(r => r.data.data),

    enroll: (body: { sectionId: string; userId: string; role: string; status?: string; isSisManaged?: boolean }) =>
      apiClient.post('/enrollments', body).then(r => r.data),

    drop: (sectionId: string, userId: string) =>
      apiClient.patch(`/enrollments/sections/${sectionId}/users/${userId}/drop`).then(r => r.data),

    complete: (sectionId: string, userId: string) =>
      apiClient.patch(`/enrollments/sections/${sectionId}/users/${userId}/complete`).then(r => r.data),

    unenroll: (sectionId: string, userId: string) =>
      apiClient.delete(`/enrollments/sections/${sectionId}/users/${userId}`).then(r => r.data),
  },

  gradebook: {
    calculate: (shellId: string) =>
      apiClient.get<{ data: StudentFinalGrade[] }>(`/gradebook/${shellId}/calculate`).then(r => r.data.data),

    persist: (shellId: string) =>
      apiClient.post(`/gradebook/${shellId}/persist`).then(r => r.data),

    override: (shellId: string, studentId: string, adjustedNumeric: number) =>
      apiClient.patch(`/gradebook/${shellId}/students/${studentId}/override`, { adjustedNumeric }).then(r => r.data),

    release: (shellId: string, studentIds?: string[]) =>
      apiClient.post(`/gradebook/${shellId}/release`, { studentIds }).then(r => r.data),

    postToSis: (shellId: string, studentIds: string[]) =>
      apiClient.post(`/gradebook/${shellId}/post-to-sis`, { studentIds }).then(r => r.data),

    exportElcCsv: (shellId: string) =>
      apiClient.get(`/gradebook/${shellId}/export/elc-csv`, { responseType: 'blob' }).then(r => r.data as Blob),

    exportAthenaCsv: (shellId: string, sisTermCode: string, crn: string) =>
      apiClient.get(`/gradebook/${shellId}/export/athena-csv`, {
        params: { sisTermCode, crn },
        responseType: 'blob',
      }).then(r => r.data as Blob),

    categories: (shellId: string) =>
      apiClient.get<{ data: GradeCategory[] }>(`/gradebook/${shellId}/categories`).then(r => r.data.data),

    createCategory: (shellId: string, body: { name: string; weightPercent: number; dropLowestCount?: number; sortOrder?: number }) =>
      apiClient.post<{ data: GradeCategory }>(`/gradebook/${shellId}/categories`, body).then(r => r.data.data),

    items: (shellId: string) =>
      apiClient.get<{ data: GradeItem[] }>(`/gradebook/${shellId}/items`).then(r => r.data.data),

    createItem: (shellId: string, body: { categoryId?: string; title: string; maxPoints: number; itemWeightPercent: number; isBonus?: boolean; dueDate?: string }) =>
      apiClient.post<{ data: GradeItem }>(`/gradebook/${shellId}/items`, body).then(r => r.data.data),

    upsertEntry: (shellId: string, body: { gradeItemId: string; studentId: string; pointsEarned: number | null; isExempt?: boolean; publicFeedback?: string; privateGraderComments?: string }) =>
      apiClient.put(`/gradebook/${shellId}/entries`, body).then(r => r.data),
  },

  crosslist: {
    crosslist: (childSectionId: string, targetPrimaryShellId: string) =>
      apiClient.post('/crosslist', { childSectionId, targetPrimaryShellId }).then(r => r.data),

    decrosslist: (sectionId: string) =>
      apiClient.post('/crosslist/decrosslist', { sectionId }).then(r => r.data),

    verifyPermission: (permission: 'DECROSSLIST' | 'SIS_OVERRIDE' | 'GRADE_UNLOCK') =>
      apiClient.get<{ data: { permission: string; hasPermission: boolean } }>('/crosslist/verify-permission', { params: { permission } }).then(r => r.data.data),
  },
};

// ─── Download helper ──────────────────────────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
