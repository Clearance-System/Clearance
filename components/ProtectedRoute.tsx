'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: ('student' | 'staff' | 'admin')[];
}) {
  const { role, token } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!token) {
      // Not logged in: redirect to login
      router.replace('/login');
      return;
    }

    if (allowedRoles && !allowedRoles.includes(role as any)) {
      // Not authorized for this role: redirect to appropriate dashboard
      if (role === 'student') router.replace('/student/dashboard');
      else if (role === 'staff') router.replace('/staff/dashboard');
      else if (role === 'admin') router.replace('/admin/dashboard');
    }
  }, [token, role, router, pathname, allowedRoles]);

  if (!token || (allowedRoles && !allowedRoles.includes(role as any))) {
    // Show premium themed loading spinner or indicator
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
          Verifying credentials...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
