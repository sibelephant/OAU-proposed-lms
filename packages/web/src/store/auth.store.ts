import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'Student' | 'Instructor' | 'TA' | 'Designer' | 'Auditor' | 'SystemAdmin';

export interface AuthUser {
  id: string;
  loginId: string;
  orgDefinedId: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  contextShellId?: string;
  ltiLaunch?: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;

  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;

  // Role guards
  isInstructor: () => boolean;
  isStudent: () => boolean;
  isAdmin: () => boolean;
  canGrade: () => boolean;
  canManageCrosslist: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setSession: (token, user) => {
        localStorage.setItem('atlas_token', token);
        set({ token, user, isAuthenticated: true });
      },

      clearSession: () => {
        localStorage.removeItem('atlas_token');
        set({ token: null, user: null, isAuthenticated: false });
      },

      isInstructor: () => {
        const role = get().user?.role;
        return role === 'Instructor' || role === 'SystemAdmin';
      },

      isStudent: () => get().user?.role === 'Student',

      isAdmin: () => get().user?.role === 'SystemAdmin',

      canGrade: () => {
        const role = get().user?.role;
        return role === 'Instructor' || role === 'TA' || role === 'SystemAdmin';
      },

      canManageCrosslist: () => {
        const role = get().user?.role;
        return role === 'Instructor' || role === 'SystemAdmin';
      },
    }),
    {
      name: 'atlas-auth',
      // Only persist non-sensitive fields
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
