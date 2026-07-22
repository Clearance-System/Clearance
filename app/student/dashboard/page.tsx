'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyDocuments,
  uploadDocument,
  uploadStudentSignature,
  submitClearanceRequest,
  getClearanceStatus,
  downloadClearanceSlip,
} from '@/api/student';
import { FileUpload } from '@/components/FileUpload';
import { DocumentPreview } from '@/components/DocumentPreview';
import { useAuth } from '@/context/AuthProvider';
import {
  CheckCircle2, XCircle, Clock, FileDown, UploadCloud,
  Send, Check, RefreshCw, FileText, AlertTriangle, Info,
} from 'lucide-react';
import { useState } from 'react';

const DOC_TYPES = [
  { id: 'School Fees Receipt', name: 'School Fees Receipt' },
  { id: 'Acceptance Fee Receipt', name: 'Acceptance Fee Receipt' },
  { id: 'Library Card', name: 'Library Card' },
  { id: 'Student ID Card', name: 'Student ID Card' },
  { id: 'Departmental Form', name: 'Departmental Form' },
  { id: 'Hostel Clearance', name: 'Hostel Clearance' },
  { id: 'Alumni Fee Receipt', name: 'Alumni Fee Receipt' },
  { id: 'Faculty Dues Receipt', name: 'Faculty Dues Receipt' },
  { id: 'Sports Council Clearance', name: 'Sports Council Clearance' },
  { id: 'Security Clearance', name: 'Security Clearance' },
];

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-20 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}
      style={{ animation: 'slideIn 0.3s ease' }}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      <span>{msg}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normStatus = (status || '').toLowerCase();
  if (normStatus === 'approved') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
      <CheckCircle2 className="w-3.5 h-3.5" />Approved
    </span>
  );
  if (normStatus === 'rejected') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20">
      <XCircle className="w-3.5 h-3.5" />Rejected
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20">
      <Clock className="w-3.5 h-3.5" />Pending
    </span>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocType, setSelectedDocType] = useState(DOC_TYPES[0].id);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ id: string; url: string; type: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch documents
  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['myDocuments'],
    queryFn: getMyDocuments,
    retry: 1,
  });

  // Fetch clearance status
  const { data: clearanceStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['clearanceStatus'],
    queryFn: getClearanceStatus,
    retry: 1,
  });

  const docs: any[] = documents || [];
  const approved = docs.filter((d) => (d.status || '').toLowerCase() === 'approved').length;
  const pending = docs.filter((d) => (d.status || '').toLowerCase() === 'pending').length;
  const rejected = docs.filter((d) => (d.status || '').toLowerCase() === 'rejected').length;
  const total = docs.length;
  const requiredCount = clearanceStatus?.required_count || 9;
  const isFullyCleared = !!clearanceStatus?.all_approved || (approved >= requiredCount);
  const pct = Math.min(100, Math.round((approved / requiredCount) * 100));

  // Upload signature
  const sigMutation = useMutation({
    mutationFn: uploadStudentSignature,
    onSuccess: () => showToast('Signature uploaded successfully!', 'success'),
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Signature upload failed.', 'error'),
  });

  // Upload document
  const docMutation = useMutation({
    mutationFn: ({ type, file }: { type: string; file: File }) => uploadDocument(type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['clearanceStatus'] });
      showToast('Document uploaded!', 'success');
    },
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Upload failed.', 'error'),
  });

  // Submit request
  const submitMutation = useMutation({
    mutationFn: submitClearanceRequest,
    onSuccess: () => {
      refetchStatus();
      showToast('Clearance request submitted!', 'success');
    },
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Submission failed.', 'error'),
  });

  // Download slip
  const slipMutation = useMutation({
    mutationFn: downloadClearanceSlip,
    onSuccess: () => showToast('Clearance slip downloaded!', 'success'),
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Download failed.', 'error'),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-x-12 -translate-y-12" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">Student Clearance Dashboard</h1>
          <p className="mt-1 text-indigo-200 text-sm">
            Welcome, <span className="font-semibold text-white">{user?.name}</span>
            {user?.matric_number && <span className="ml-2 text-indigo-300">· {user.matric_number}</span>}
            {user?.faculty && <span className="ml-2 text-indigo-300">· {user.faculty}</span>}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Total Docs', val: total, color: 'bg-white/10' },
              { label: 'Approved', val: approved, color: 'bg-emerald-500/20' },
              { label: 'Pending', val: pending, color: 'bg-yellow-500/20' },
              { label: 'Rejected', val: rejected, color: 'bg-rose-500/20' },
            ].map(({ label, val, color }) => (
              <div key={label} className={`${color} backdrop-blur-md rounded-2xl p-4 border border-white/10`}>
                <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">{label}</p>
                <p className="text-2xl font-bold mt-1">{val}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex justify-between text-xs text-indigo-200 font-bold mb-1">
              <span>CLEARANCE PROGRESS</span><span>{pct}%</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-indigo-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Clearance Status Card */}
      {clearanceStatus && (
        <div className={`mb-8 p-5 rounded-2xl border flex items-start gap-4 ${
          clearanceStatus.status === 'cleared'
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
            : clearanceStatus.status === 'rejected'
            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'
            : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30'
        }`}>
          {clearanceStatus.status === 'cleared'
            ? <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            : clearanceStatus.status === 'rejected'
            ? <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            : <Info className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />}
          <div>
            <p className="font-bold text-sm capitalize text-zinc-800 dark:text-zinc-200">
              Clearance Status: {clearanceStatus.status?.replace(/_/g, ' ')}
            </p>
            {clearanceStatus.message && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{clearanceStatus.message}</p>
            )}
          </div>
          <button onClick={() => refetchStatus()} className="ml-auto p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Upload Panel */}
        <div className="space-y-6 lg:col-span-1">
          {/* Signature Upload */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />Signature Upload
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Your signature is embedded in clearance slips.</p>
            <FileUpload
              onFileSelect={(f) => sigMutation.mutate(f)}
              label="Upload signature image"
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
            />
            {sigMutation.isPending && <p className="text-xs text-indigo-400 mt-2 animate-pulse">Uploading…</p>}
          </div>

          {/* Document Upload */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-500" />Upload Document
            </h3>
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Document Type
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <FileUpload
              onFileSelect={(f) => {
                docMutation.mutate({ type: selectedDocType, file: f });
              }}
              label={`Upload ${DOC_TYPES.find((d) => d.id === selectedDocType)?.name}`}
            />
            {docMutation.isPending && <p className="text-xs text-indigo-400 mt-2 animate-pulse">Uploading…</p>}
          </div>
        </div>

        {/* Right: Documents + Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documents List */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-5">Submitted Documents</h3>
            {docsLoading ? (
              <div className="text-center py-12 text-zinc-400 animate-pulse">Loading documents…</div>
            ) : docs.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                <UploadCloud className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-sm font-medium text-zinc-500">No documents uploaded yet</p>
                <p className="text-xs text-zinc-400 mt-1">Upload your required receipts using the panel on the left</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((doc: any) => (
                  <div key={doc._id || doc.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm capitalize">
                          {(doc.document_type || doc.type || '').replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                    {doc.remark && (
                      <div className="mt-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Remark:</p>
                        <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">{doc.remark}</p>
                      </div>
                    )}
                    {doc.file_url && (
                      <button
                        onClick={() => {
                          setPreviewDoc({
                            id: doc.id || doc._id,
                            url: doc.file_url,
                            type: doc.document_type || doc.type || 'Document'
                          });
                          setPreviewOpen(true);
                        }}
                        className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-500 hover:underline cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />View File
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1">Submit & Download</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              Submit your request once all documents are uploaded. Download your clearance slip when all are approved.
            </p>
            {!isFullyCleared && rejected > 0 && (
              <div className="mb-4 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/20">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Some documents were rejected. Re-upload the corrected files before submitting.</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || docs.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {submitMutation.isPending ? 'Submitting…' : 'Submit Clearance Request'}
              </button>
              <button
                onClick={() => slipMutation.mutate()}
                disabled={!isFullyCleared || slipMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
              >
                <FileDown className="w-4 h-4" />
                {slipMutation.isPending ? 'Downloading…' : 'Download Clearance Slip'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {previewDoc && (
        <DocumentPreview
          isOpen={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewDoc(null);
          }}
          documentId={previewDoc.id}
          fileUrl={previewDoc.url}
          documentType={previewDoc.type}
        />
      )}
    </div>
  );
}
