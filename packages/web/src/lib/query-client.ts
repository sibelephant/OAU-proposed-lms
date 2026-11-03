import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30 seconds
      gcTime: 5 * 60_000,       // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry 4xx errors
        if (axios.isAxiosError(error) && error.response) {
          const status = error.response.status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// ─── Query key factory ────────────────────────────────────────────────────────
// Centralised so invalidation is type-safe and consistent.

export const qk = {
  courses: {
    all: ['courses'] as const,
    list: (termId?: string) => ['courses', 'list', termId ?? ''] as const,
    detail: (shellId: string) => ['courses', shellId] as const,
    sections: (shellId: string) => ['courses', shellId, 'sections'] as const,
  },
  enrollments: {
    bySection: (sectionId: string) => ['enrollments', 'section', sectionId] as const,
    byUser: (userId: string) => ['enrollments', 'user', userId] as const,
  },
  gradebook: {
    calculate: (shellId: string) => ['gradebook', shellId, 'calculate'] as const,
    categories: (shellId: string) => ['gradebook', shellId, 'categories'] as const,
    items: (shellId: string) => ['gradebook', shellId, 'items'] as const,
  },
  crosslist: {
    permission: (perm: string) => ['crosslist', 'permission', perm] as const,
  },
};
