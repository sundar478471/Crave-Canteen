export const UserRole = {
  STUDENT: 'STUDENT',
  FACULTY: 'FACULTY',
  KITCHEN: 'KITCHEN',
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN'
} as const;
export type UserRole = 'STUDENT' | 'FACULTY' | 'KITCHEN' | 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
}
