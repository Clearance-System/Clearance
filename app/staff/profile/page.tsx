'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStaffProfile, updateStaffProfile } from '@/api/staff';
import { useAuth } from '@/context/AuthProvider';
import { FileUpload } from '@/components/FileUpload';
import {
  User, Mail, Shield, Building, IdCard, Signature, CheckCircle2,
  X, ChevronDown, Check, XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-20 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      <span>{msg}</span>
    </div>
  );
}

export default function StaffProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sigFile, setSigFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ['staffProfile'],
    queryFn: getStaffProfile,
    retry: 1,
  });

  const profileMutation = useMutation({
    mutationFn: () => {
      if (!sigFile) throw new Error('Please select a signature image.');
      const staffId = profile?.staff_id || user?.staff_id || '';
      const postHeld = profile?.post_held || user?.post_held || '';
      const faculty = profile?.faculty || user?.faculty || '';
      return updateStaffProfile({ staff_id: staffId, post_held: postHeld, faculty, signature: sigFile });
    },
    onSuccess: () => {
      setProfileOpen(false);
      setSigFile(null);
      queryClient.invalidateQueries({ queryKey: ['staffProfile'] });
      showToast('Signature updated successfully!', 'success');
    },
    onError: (e: any) => showToast(e?.response?.data?.detail || e?.message || 'Update failed.', 'error'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const staffData = profile || user;
  const isCompleted = !!staffData?.profile_completed;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        {/* Header / Banner */}
        <div className="bg-zinc-950 px-6 py-10 sm:px-10 sm:py-12 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-10 h-10" />
            </div>
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {staffData?.title} {staffData?.first_name} {staffData?.last_name || staffData?.name}
                </h1>
                {isCompleted && (
                  <span title="Profile Complete">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                  </span>
                )}
              </div>
              <p className="text-zinc-400 text-sm">
                Administrative Officer Profile · {isCompleted ? 'Verified' : 'Pending Verification'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Info Details Grid */}
        <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">
              Employment Details
            </h2>

            {/* Post Held */}
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Post Held</p>
                <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                  {staffData?.post_held || <span className="text-rose-500 font-normal italic">Not Set</span>}
                </p>
              </div>
            </div>

            {/* Staff ID */}
            <div className="flex items-start space-x-3">
              <IdCard className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Staff ID</p>
                <p className="text-zinc-800 dark:text-zinc-200 font-mono font-medium">
                  {staffData?.staff_id || <span className="text-rose-500 font-normal italic">Not Set</span>}
                </p>
              </div>
            </div>

            {/* Faculty */}
            <div className="flex items-start space-x-3">
              <Building className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Faculty</p>
                <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                  {staffData?.faculty || <span className="text-rose-500 font-normal italic">Not Set</span>}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Email Address</p>
                <p className="text-zinc-800 dark:text-zinc-200 font-medium">{staffData?.email}</p>
              </div>
            </div>
          </div>

          {/* Signature Box */}
          <div className="space-y-6 flex flex-col">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">
              Authorization Signature
            </h2>

            {staffData?.signature_url ? (
              <div className="flex-1 flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden group min-h-[160px]">
                {/* Real-world grid lines design */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-30 pointer-events-none" />
                <div className="relative z-10 flex items-center justify-center p-4">
                  <img
                    src={staffData.signature_url}
                    alt="Digital Signature"
                    className="max-h-24 max-w-xs object-contain pointer-events-none filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="mt-3 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-600 z-10 flex items-center gap-1">
                  <Signature className="w-3.5 h-3.5" />
                  Background-Removed Authorization Sign
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl p-6 text-center text-zinc-500 min-h-[160px]">
                <Signature className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-2 animate-pulse" />
                <p className="text-sm font-medium">No signature uploaded yet</p>
                <p className="text-xs text-zinc-400 mt-1">Upload a signature to begin clearing student files</p>
              </div>
            )}

            <button
              onClick={() => setProfileOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/25"
            >
              <Signature className="w-4 h-4" />
              {isCompleted ? 'Change Signature' : 'Complete Setup'}
            </button>
          </div>
        </div>
      </div>

      {/* Signature Update Modal (reused here) */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ animation: 'scaleUp .25s ease' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Update Signature</h3>
              <button onClick={() => setProfileOpen(false)}
                className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500 dark:text-zinc-400">
                Your profile information has been locked. You can only update your authorization signature image.
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Signature Image *</label>
                <FileUpload
                  onFileSelect={(f) => setSigFile(f)}
                  label="Upload signature image"
                  accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-end gap-3">
              <button onClick={() => setProfileOpen(false)}
                className="px-4 py-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors">
                Cancel
              </button>
              <button
                disabled={profileMutation.isPending || !sigFile}
                onClick={() => profileMutation.mutate()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
              >
                {profileMutation.isPending ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
