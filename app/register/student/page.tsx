'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { registerStudent } from '@/api/auth';
import { GraduationCap, ArrowLeft, Mail, User, Award, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type StudentForm = {
  name: string;
  matric_number: string;
  faculty: string;
  department: string;
  password: string;
  confirm_password: string;
};

const FACULTIES = [
  'Faculty of Engineering',
  'Faculty of Science',
  'Faculty of Arts',
  'Faculty of Social Sciences',
  'Faculty of Law',
  'Faculty of Education',
  'Faculty of Agriculture',
  'Faculty of Management Sciences',
  'Faculty of Environmental Sciences',
];

const DEPARTMENTS: Record<string, string[]> = {
  'Faculty of Engineering': ['Computer Science', 'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering', 'Chemical Engineering'],
  'Faculty of Science': ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Statistics'],
  'Faculty of Arts': ['English', 'History', 'Philosophy', 'Linguistics', 'Theatre Arts'],
  'Faculty of Social Sciences': ['Economics', 'Psychology', 'Sociology', 'Political Science', 'Geography'],
  'Faculty of Law': ['Law'],
  'Faculty of Education': ['Education', 'Guidance and Counselling'],
  'Faculty of Agriculture': ['Agronomy', 'Animal Science', 'Agricultural Economics'],
  'Faculty of Management Sciences': ['Business Administration', 'Accounting', 'Finance', 'Marketing'],
  'Faculty of Environmental Sciences': ['Architecture', 'Estate Management', 'Urban Planning'],
};

export default function StudentRegister() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<StudentForm>({
    defaultValues: { name: '', matric_number: '', faculty: '', department: '', password: '', confirm_password: '' },
  });

  const selectedFaculty = watch('faculty');

  const registerMutation = useMutation({
    mutationFn: registerStudent,
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    },
  });

  const onSubmit = (data: StudentForm) => registerMutation.mutate(data);

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
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Student Registration</h1>
            <p className="text-xs text-zinc-400">Create your academic clearance profile</p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-semibold text-white">Registration Successful!</h3>
            <p className="text-sm text-zinc-400">Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Full Name</label>
              <div className="relative group">
                <User className="absolute left-3 top-3 w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  {...register('name', { required: 'Full name is required' })}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="e.g. John Adebayo"
                />
              </div>
              {errors.name && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name.message}</p>}
            </div>

            {/* Matric Number */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Matric Number</label>
              <div className="relative group">
                <Award className="absolute left-3 top-3 w-5 h-5 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  {...register('matric_number', {
                    required: 'Matric number is required',
                    pattern: {
                      value: /^\d{9}$/,
                      message: 'Matric number must be exactly 9 digits (e.g. 200903064)',
                    }
                  })}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  placeholder="e.g. 200903064"
                />
              </div>
              {errors.matric_number && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.matric_number.message}</p>}
            </div>

            {/* Faculty */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Faculty</label>
              <div className="relative group">
                <BookOpen className="absolute left-3 top-3 w-5 h-5 text-zinc-500 pointer-events-none" />
                <select
                  {...register('faculty', { required: 'Faculty is required' })}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="">Select Faculty</option>
                  {FACULTIES.map(f => <option key={f} value={f} className="bg-zinc-900">{f}</option>)}
                </select>
              </div>
              {errors.faculty && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.faculty.message}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">Department</label>
              <select
                {...register('department', { required: 'Department is required' })}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">Select Department</option>
                {(DEPARTMENTS[selectedFaculty] || []).map(d => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
              </select>
              {errors.department && <p className="text-rose-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.department.message}</p>}
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
              {registerMutation.isPending ? 'Registering...' : 'Create Account'}
            </button>
          </form>
        )}

        {registerMutation.isError && (
          <div className="flex items-start space-x-2 mt-4 text-rose-400 text-sm bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{(registerMutation.error as any)?.response?.data?.detail || 'Registration failed. Please check your details.'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
