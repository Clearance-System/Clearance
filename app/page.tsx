'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

export default function Home() {
  const { token, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'staff') {
        router.push('/staff/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [token, role, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-zinc-200 dark:border-zinc-800"></div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">
        Directing to dashboard...
      </p>
    </div>
  );
}

