'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { registerStaff } from '@/api/auth';
import { Users2, ArrowLeft, Mail, User, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type StaffForm = {
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
};

const TITLES = ['Mr.', 'Mrs.', 'Miss', 'Ms.', 'Dr.', 'Prof.', 'Engr.', 'Rev.'];

export default function StaffRegister() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<StaffForm>({
    defaultValues: { title: '', first_name: '', last_name: '', email: '', password: '', confirm_password: '' },
  });

  const registerMutation = useMutation({
    mutationFn: registerStaff,
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    },
  });

  const onSubmit = (data: StaffForm) => registerMutation.mutate(data);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950 py-12 px-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-2xl relative z-10">

        <Link href="/login" className="inline-flex items-center space-x-2 text-zinc-400 hover:text-white text-sm font-medium transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 duration-300" />
          <span>Back to Login</span>
        </Link>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
            <Users2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Staff Registration</h1>
            <p className="text-xs text-zinc-400">Create your administrative clearance profile</p>
          </div>
        </div>

        {/* Pending approval notice */}
        <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          ℹ️ Staff accounts require <strong>admin approval</strong> before you can log in.
        </div>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-semibold text-white">Registration Submitted!</h3>
            <p className="text-sm text-zinc-400">Awaiting admin approval. Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Title</label>
              <div className="relative">
                <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-zinc-500 pointer-events-none" />
                <select
                  {...register('title', { required: 'Title is required' })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="">Select Title</option>
                  {TITLES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                </select>
              </div>
              {errors.title && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title.message}</p>}
            </div>

            {/* First & Last Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">First Name</label>
                <input
                  type="text"
                  {...register('first_name', { required: 'First name is required' })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="Jane"
                />
                {errors.first_name && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.first_name.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Last Name</label>
                <input
                  type="text"
                  {...register('last_name', { required: 'Last name is required' })}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="Doe"
                />
                {errors.last_name && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.last_name.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                  })}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="jane.doe@university.edu"
                />
              </div>
              {errors.email && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <input
                type="password"
                {...register('confirm_password', {
                  required: 'Please confirm your password',
                  validate: (val) => val === watch('password') || 'Passwords do not match',
                })}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                placeholder="••••••••"
              />
              {errors.confirm_password && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirm_password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {registerMutation.isPending ? 'Submitting...' : 'Register Staff Account'}
            </button>
          </form>
        )}

        {registerMutation.isError && (
          <div className="flex items-start space-x-2 mt-4 text-rose-400 text-sm bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{(registerMutation.error as any)?.response?.data?.detail || 'Registration failed.'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
