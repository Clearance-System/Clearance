'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthProvider';
import { loginUser } from '@/api/auth';
import { Lock, User, FileCheck, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

type LoginForm = { username: string; password: string };

export default function Login() {
  const router = useRouter();
  const { login, role } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: { username: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      // login() fetches /users/me internally to determine role
      await login(data);
      // role won't update synchronously in this closure; redirect via window
      // after login sets role in localStorage
      const savedRole = localStorage.getItem('role');
      if (savedRole === 'admin') router.push('/admin/dashboard');
      else if (savedRole === 'staff') router.push('/staff/dashboard');
      else router.push('/student/dashboard');
    },
  });

  const onSubmit = (data: LoginForm) => loginMutation.mutate(data);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-2xl relative z-10 mx-4">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-400 mb-3 border border-indigo-500/20">
            <FileCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
          <p className="text-sm text-zinc-400 mt-1">Sign in to your clearance portal</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Username / Email / Matric No.
            </label>
            <div className="relative group">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                {...register('username', { required: 'Username is required' })}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="Enter your username"
              />
            </div>
            {errors.username && (
              <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />{errors.username.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="password"
                {...register('password', { required: 'Password is required' })}
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <p className="text-rose-500 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />{errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span>{loginMutation.isPending ? 'Signing in...' : 'Sign In'}</span>
            {!loginMutation.isPending && (
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-300" />
            )}
          </button>
        </form>

        {loginMutation.isError && (
          <div className="flex items-start space-x-2 mt-4 text-rose-400 text-sm bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              {(loginMutation.error as any)?.response?.data?.detail || 'Login failed. Check your credentials.'}
            </span>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-zinc-800 text-center space-y-3">
          <p className="text-xs text-zinc-500">Don't have an account?</p>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold">
            <Link href="/register/student" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
              Register as Student
            </Link>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
            <Link href="/register/staff" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
              Register as Staff
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
