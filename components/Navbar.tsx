'use client';

import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, User as UserIcon, ShieldAlert, GraduationCap, Users2, Menu, X, FileCheck } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null; // Don't show Navbar if user is not authenticated

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'staff') return '/staff/dashboard';
    return '/student/dashboard';
  };

  const links = {
    student: [
      { name: 'Dashboard', href: '/student/dashboard', icon: GraduationCap },
    ],
    staff: [
      { name: 'Dashboard', href: '/staff/dashboard', icon: Users2 },
      { name: 'Profile', href: '/staff/profile', icon: UserIcon },
    ],
    admin: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: ShieldAlert },
    ],
  };

  const currentLinks = role ? links[role] : [];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center">
            <Link href={getDashboardPath()} className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 group">
              <FileCheck className="w-8 h-8 transition-transform group-hover:scale-110 duration-300" />
              <span className="font-bold text-xl tracking-tight text-zinc-900 dark:text-white">
                Clearance<span className="text-indigo-600 dark:text-indigo-400">System</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {currentLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {/* Separator */}
            <span className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

            {/* User Profile Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-left">
                <div className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1 max-w-[120px]">
                    {user.name || user.email}
                  </p>
                  <p className="text-zinc-500 dark:text-zinc-500 capitalize">{user.role}</p>
                </div>
              </div>

              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-zinc-100 hover:bg-rose-50 dark:bg-zinc-900 dark:hover:bg-rose-950/20 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 text-sm font-medium transition-all duration-300 border border-zinc-200/50 dark:border-zinc-800/50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Options */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-2 pb-4 space-y-2 animate-fadeIn">
          {currentLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2 px-3 py-3 rounded-lg text-base font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center space-x-3 px-3">
              <div className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                  {user.name || user.email}
                </p>
                <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-medium transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
export default Navbar;
