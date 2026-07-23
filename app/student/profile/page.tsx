'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateStudentProfile } from '@/api/student';
import { FileUpload } from '@/components/FileUpload';
import { useAuth } from '@/context/AuthProvider';
import Link from 'next/link';
import {
  User as UserIcon, Camera, PenTool, ShieldCheck, Lock, CheckCircle2,
  AlertTriangle, Check, XCircle, ArrowLeft, Mail, IdCard, GraduationCap, Building
} from 'lucide-react';

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed top-20 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all ${
        type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
      }`}
      style={{ animation: 'slideIn 0.3s ease' }}
    >
      {type === 'success' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
      <span>{msg}</span>
    </div>
  );
}

export default function StudentProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const hasSignature = !!user?.signature_url;
  const hasPassport = !!user?.passport_url;
  const isProfileComplete = !!(user?.profile_completed && hasSignature && hasPassport);
  const signatureChanges = user?.signature_changes || 0;
  const signatureLocked = isProfileComplete && signatureChanges >= 2;

  const profileMutation = useMutation({
    mutationFn: updateStudentProfile,
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['clearanceStatus'] });
      setSignatureFile(null);
      setPassportFile(null);
      showToast('Profile updated successfully!', 'success');
    },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail;
      const errorMsg = typeof detail === 'string'
        ? detail
        : (Array.isArray(detail) ? detail[0]?.msg : e?.message || 'Profile update failed.');
      showToast(errorMsg, 'error');
    },
  });

  const handleProfileSubmit = () => {
    if (!isProfileComplete) {
      const willHaveSig = !!signatureFile || hasSignature;
      const willHavePassport = !!passportFile || hasPassport;

      if (!willHaveSig || !willHavePassport) {
        showToast('Both signature and passport photo are required to complete your profile', 'error');
        return;
      }
    } else {
      if (!signatureFile && !passportFile) {
        showToast('Please provide either a new signature or a new passport photo to update your profile', 'error');
        return;
      }
      if (signatureFile && signatureLocked) {
        showToast('You can only change your signature 2 times after initial upload', 'error');
        return;
      }
    }

    profileMutation.mutate({
      signatureFile: signatureFile || undefined,
      passportFile: passportFile || undefined,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {isProfileComplete ? (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
            <CheckCircle2 className="w-4 h-4" /> Profile Verified & Complete
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30">
            <AlertTriangle className="w-4 h-4" /> Profile Setup Incomplete
          </span>
        )}
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-2xl border border-indigo-100 dark:border-indigo-900/30">
              {user?.name?.charAt(0) || user?.first_name?.charAt(0) || 'S'}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                {user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Student Profile'}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {user?.matric_number ? `Matric: ${user.matric_number}` : 'Student Account'}
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-zinc-400">
            <p>Role: <span className="font-semibold text-zinc-700 dark:text-zinc-300 capitalize">{user?.role || 'Student'}</span></p>
            <p className="mt-0.5">Status: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{isProfileComplete ? 'Complete' : 'Pending Uploads'}</span></p>
          </div>
        </div>

        {/* Academic Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span className="text-[11px] font-bold uppercase">Email Address</span>
            </div>
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{user?.email || '—'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <IdCard className="w-4 h-4 text-indigo-500" />
              <span className="text-[11px] font-bold uppercase">Matric Number</span>
            </div>
            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{user?.matric_number || '—'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <GraduationCap className="w-4 h-4 text-indigo-500" />
              <span className="text-[11px] font-bold uppercase">Faculty</span>
            </div>
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{user?.faculty || '—'}</p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Building className="w-4 h-4 text-indigo-500" />
              <span className="text-[11px] font-bold uppercase">Department</span>
            </div>
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{user?.department || '—'}</p>
          </div>
        </div>
      </div>

      {/* Media Cards & Update Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Passport & Signature Display */}
        <div className="lg:col-span-1 space-y-6">
          {/* Passport Photo */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-indigo-500" /> Passport Photograph
            </p>

            {user?.passport_url ? (
              <div className="relative group">
                <img
                  src={user.passport_url}
                  alt="Student Passport"
                  className="w-36 h-48 object-cover rounded-2xl border-2 border-indigo-500/30 shadow-lg transition-transform group-hover:scale-105"
                />
                <span className="absolute bottom-2 right-2 p-1.5 bg-emerald-500 text-white rounded-full shadow-md">
                  <Check className="w-4 h-4" />
                </span>
              </div>
            ) : (
              <div className="w-36 h-48 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 text-zinc-400">
                <Camera className="w-10 h-10 mb-2 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-500">No Passport Uploaded</span>
              </div>
            )}
            <p className="text-xs text-zinc-400 mt-3">Embedded on official clearance slip</p>
          </div>

          {/* Digital Signature */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-indigo-500" /> Digital Signature
            </p>

            {user?.signature_url ? (
              <div className="relative w-52 h-28 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-center shadow-inner">
                <img
                  src={user.signature_url}
                  alt="Student Signature"
                  className="max-h-full max-w-full object-contain"
                />
                <span className="absolute bottom-2 right-2 p-1 bg-emerald-500 text-white rounded-full shadow-md">
                  <Check className="w-3 h-3" />
                </span>
              </div>
            ) : (
              <div className="w-52 h-28 rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-950 text-zinc-400">
                <PenTool className="w-8 h-8 mb-1 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-500">No Signature Uploaded</span>
              </div>
            )}

            <p className="text-xs text-zinc-400 mt-3">
              Signature updates used: <span className="font-bold text-zinc-700 dark:text-zinc-200">{signatureChanges} / 2</span>
            </p>
          </div>
        </div>

        {/* Update Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Update Profile Media
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Upload a new passport photograph or update your digital signature. Note that signatures can only be updated 2 times maximum after initial setup.
              </p>
            </div>

            {/* Passport Photo Dropzone */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-500" />
                Passport Photo {!isProfileComplete && <span className="text-rose-500">*</span>}
              </label>
              <FileUpload
                onFileSelect={(f) => setPassportFile(f)}
                label={passportFile ? `Selected: ${passportFile.name}` : user?.passport_url ? 'Replace Passport Photo' : 'Upload Passport Photo'}
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
              />
            </div>

            {/* Signature Dropzone */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                Digital Signature {!isProfileComplete && <span className="text-rose-500">*</span>}
              </label>
              {signatureLocked ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 flex-shrink-0 text-amber-500" />
                  <span>Signature change limit reached (2/2 changes used). Signature updates are now locked.</span>
                </div>
              ) : (
                <FileUpload
                  onFileSelect={(f) => setSignatureFile(f)}
                  label={signatureFile ? `Selected: ${signatureFile.name}` : user?.signature_url ? 'Replace Signature Image' : 'Upload Signature Image'}
                  accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                />
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleProfileSubmit}
              disabled={profileMutation.isPending}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              {profileMutation.isPending ? 'Saving Profile…' : isProfileComplete ? 'Save Profile Updates' : 'Complete Profile Setup'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
