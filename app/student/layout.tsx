'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
