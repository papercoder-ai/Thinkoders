/**
 * Shared authentication guard hook for frontend pages
 */
import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface UseAuthGuardOptions {
  requiredRole?: 'worker' | 'manager' | 'hr' | 'admin';
  allowedRoles?: Array<'worker' | 'manager' | 'hr' | 'admin'>;
  redirectTo?: string;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { requiredRole, allowedRoles, redirectTo = '/' } = options;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (user) {
      // Check required role
      if (requiredRole && user.role !== requiredRole) {
        router.push(redirectTo);
        return;
      }

      // Check allowed roles
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.push(redirectTo);
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, router, requiredRole, allowedRoles, redirectTo]);

  return { isAuthenticated, isLoading, user };
}
