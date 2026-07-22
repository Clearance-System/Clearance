'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStaffDocuments,
  approveDocument,
  rejectDocument,
  updateStaffProfile,
  getStaffProfile,
} from '@/api/staff';
import { useAuth } from '@/context/AuthProvider';
import { FileUpload } from '@/components/FileUpload';
import { DocumentPreview } from '@/components/DocumentPreview';
import {
  CheckCircle2, XCircle, Clock, Search, Eye, X,
  Check, AlertTriangle, FileText, Users2, Signature, ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

const STAFF_ROLES = [
  'Bursary',
  'University Librarian',
  'Director of Student Affairs',
  'Faculty Dean',
  'Hostel Officer',
  'Faculty Officer',
  'Director Sport',
  'Chief Security Officer',
];

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-20 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
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

export default function StaffDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filter & search state
  const [filter, setFilter] = useState<FilterType>('pending');
  const [search, setSearch] = useState('');

  // Review modal state
  const [activeDoc, setActiveDoc] = useState<any | null>(null);
  const [remark, setRemark] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Profile setup modal state
  const [profileOpen, setProfileOpen] = useState(false);
  const [postHeld, setPostHeld] = useState(user?.post_held || '');
  const [faculty, setFaculty] = useState(user?.faculty || '');
  const [staffId, setStaffId] = useState(user?.staff_id || '');
  const [sigFile, setSigFile] = useState<File | null>(null);

  // Fetch live staff profile from API for accurate modal pre-fill
  const { data: profileData } = useQuery({
    queryKey: ['staffProfile'],
    queryFn: getStaffProfile,
    retry: 1,
  });

  // Sync modal fields: prefer live API profile data, fall back to auth context
  useEffect(() => {
    const source = profileData || user;
    if (source) {
      setPostHeld(source.post_held || '');
      setFaculty(source.faculty || '');
      setStaffId(source.staff_id || '');
    }
  }, [profileData, user]);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch documents assigned to this staff's department
  const { data: documents, isLoading } = useQuery({
    queryKey: ['staffDocuments'],
    queryFn: getStaffDocuments,
    retry: 1,
  });

  const docs: any[] = documents || [];

  // Approve document
  const approveMutation = useMutation({
    mutationFn: (id: string) => approveDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffDocuments'] });
      setActiveDoc(null);
      showToast('Document approved successfully!', 'success');
    },
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Approval failed.', 'error'),
  });

  // Reject document
  const rejectMutation = useMutation({
    mutationFn: ({ id, remark }: { id: string; remark: string }) => rejectDocument(id, remark),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffDocuments'] });
      setActiveDoc(null);
      setRemark('');
      showToast('Document rejected.', 'success');
    },
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Rejection failed.', 'error'),
  });

  // Update staff profile (signature + post_held + faculty)
  const profileMutation = useMutation({
    mutationFn: () => {
      const isCompleted = !!(profileData?.profile_completed || user?.profile_completed);
      if (!sigFile) throw new Error('Please select a signature image.');
      if (!isCompleted) {
        if (!staffId.trim()) throw new Error('Staff ID is required.');
        if (!postHeld.trim()) throw new Error('Post Held is required.');
        const isFacultyRequired = ['Faculty Dean', 'Faculty Officer'].includes(postHeld);
        if (isFacultyRequired && !faculty.trim()) {
          throw new Error('Faculty is required for this post.');
        }
      }
      return updateStaffProfile({ staff_id: staffId, post_held: postHeld, faculty: faculty.trim() || undefined, signature: sigFile });
    },
    onSuccess: () => {
      setProfileOpen(false);
      setSigFile(null);
      queryClient.invalidateQueries({ queryKey: ['staffProfile'] });
      showToast('Profile updated successfully!', 'success');
    },
    onError: (e: any) => showToast(e?.response?.data?.detail || e?.message || 'Profile update failed.', 'error'),
  });

  // Filtered document list
  const filtered = docs.filter((d) => {
    const matchFilter = filter === 'all' || (d.status || '').toLowerCase() === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (d.student?.name || '').toLowerCase().includes(q) ||
      (d.student?.matric_number || '').toLowerCase().includes(q) ||
      (d.document_type || '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const hasSignature = !!user?.signature_url;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-x-12 -translate-y-12" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users2 className="w-6 h-6 text-indigo-400" />
              <h1 className="text-2xl font-extrabold tracking-tight">Staff Clearance Workstation</h1>
            </div>
            <p className="text-zinc-400 text-sm">
              Welcome, <span className="text-white font-semibold">{user?.title} {user?.first_name} {user?.last_name || user?.name}</span>
              {user?.post_held && <span className="ml-2 text-zinc-500">· {user.post_held}</span>}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {/* Profile setup button */}
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/20"
            >
              <Signature className="w-4 h-4" />Update Profile & Signature
            </button>
          </div>
        </div>

        {/* Signature missing warning */}
        {!hasSignature && (
          <div className="mt-4 flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 text-amber-300 text-xs px-4 py-3 rounded-xl">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>
              <strong>Action Required:</strong> You have not uploaded your authorization signature yet.
              Click <strong>"Update Profile & Signature"</strong> above to upload it before approving documents.
            </span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Documents', val: docs.length, color: 'text-zinc-900 dark:text-white' },
          { label: 'Pending Review', val: docs.filter(d => (d.status || '').toLowerCase() === 'pending').length, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Reviewed', val: docs.filter(d => (d.status || '').toLowerCase() !== 'pending').length, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm text-center">
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Documents Board */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        {/* Filter + Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 mb-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex space-x-2">
            {(['pending', 'approved', 'rejected', 'all'] as FilterType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  filter === tab
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search student, matric, doc type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-16 text-zinc-400 animate-pulse">Loading documents…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400">
            <Eye className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-medium">No documents found</p>
            <p className="text-xs mt-1">Try adjusting your filter or search query</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
              <thead className="text-xs text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-950/40">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Student</th>
                  <th className="px-5 py-3.5 font-bold">Document Type</th>
                  <th className="px-5 py-3.5 font-bold">Submitted</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {filtered.map((doc: any) => (
                  <tr key={doc._id || doc.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {doc.student?.name || doc.student_name || '—'}
                      </p>
                      <p className="text-xs text-zinc-400">{doc.student?.matric_number || doc.matric_number || ''}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                      {(doc.document_type || '').replace(/_/g, ' ')}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={doc.status} /></td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => { setActiveDoc(doc); setRemark(doc.remark || ''); }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Review Modal ── */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl" style={{ animation: 'scaleUp .25s ease' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Review Document</h3>
                <p className="text-xs text-zinc-400">
                  {activeDoc.student?.name || activeDoc.student_name} · {activeDoc.student?.matric_number || activeDoc.matric_number}
                </p>
              </div>
              <button onClick={() => { setActiveDoc(null); setRemark(''); }}
                className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Document info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider mb-0.5">Document</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200 capitalize">
                    {(activeDoc.document_type || '').replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-zinc-400 block uppercase tracking-wider mb-0.5">Status</span>
                  <StatusBadge status={activeDoc.status} />
                </div>
              </div>

              {/* File preview */}
              {activeDoc.file_url && (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-500">
                      <FileText className="inline w-3.5 h-3.5 mr-1" />Attached Document
                    </span>
                    <a href={activeDoc.file_url} target="_blank" rel="noopener noreferrer"
                      className="text-indigo-500 text-xs font-bold hover:underline">
                      Open in New Tab ↗
                    </a>
                  </div>
                  <div className="bg-zinc-100 dark:bg-zinc-950/60 p-4 flex flex-col items-center justify-center min-h-[9rem]">
                    {activeDoc.file_url.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? (
                      <div className="relative group cursor-pointer" onClick={() => setPreviewOpen(true)}>
                        <img src={activeDoc.file_url} alt="Document" className="h-32 object-contain rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition-all">
                          <span className="text-white text-xs font-semibold">Click to Zoom 🔍</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                        <p className="text-xs text-zinc-700 dark:text-zinc-350 font-medium mb-3">
                          {activeDoc.document_type?.replace(/_/g, ' ')}
                        </p>
                        <button
                          onClick={() => setPreviewOpen(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
                        >
                          Preview Document
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Remark field */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Remark (required for rejection)
                </label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                  placeholder="Provide comments or reasons for rejection…"
                  className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-800 dark:text-zinc-200"
                />
              </div>

              {!hasSignature && (
                <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/20">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Upload your signature first before approving or rejecting documents.
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-end gap-3">
              <button
                disabled={rejectMutation.isPending || !remark.trim() || !hasSignature}
                onClick={() => rejectMutation.mutate({ id: activeDoc._id || activeDoc.id, remark })}
                className="px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {rejectMutation.isPending ? 'Rejecting…' : 'Reject Document'}
              </button>
              <button
                disabled={approveMutation.isPending || !hasSignature}
                onClick={() => approveMutation.mutate(activeDoc._id || activeDoc.id)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
              >
                <Check className="w-3.5 h-3.5" />
                {approveMutation.isPending ? 'Approving…' : 'Approve & Sign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile / Signature Modal ── */}
      {profileOpen && (() => {
        const isCompleted = !!(profileData?.profile_completed || user?.profile_completed);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ animation: 'scaleUp .25s ease' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                  {isCompleted ? 'Update Signature' : 'Complete Profile & Signature'}
                </h3>
                <button onClick={() => setProfileOpen(false)}
                  className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {isCompleted && (
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-500 dark:text-zinc-400">
                    Your profile information has been locked. You can only update your authorization signature image.
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Staff ID *</label>
                  <input
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    disabled={isCompleted}
                    placeholder="e.g. STF-12345"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-800 dark:text-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Post Held *</label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-zinc-500 pointer-events-none" />
                    <select
                      value={postHeld}
                      onChange={(e) => setPostHeld(e.target.value)}
                      disabled={isCompleted}
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-800 dark:text-zinc-200 appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="" disabled>Select Role/Post</option>
                      {STAFF_ROLES.map((role) => (
                        <option key={role} value={role} className="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Faculty {['Faculty Dean', 'Faculty Officer'].includes(postHeld) ? '*' : '(optional)'}
                  </label>
                  <input
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    disabled={isCompleted}
                    placeholder="e.g. Faculty of Engineering"
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-zinc-800 dark:text-zinc-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
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
                  disabled={
                    profileMutation.isPending || 
                    (!isCompleted && (
                      !postHeld.trim() || 
                      !staffId.trim() || 
                      ((['Faculty Dean', 'Faculty Officer'].includes(postHeld)) && !faculty.trim())
                    )) || 
                    !sigFile
                  }
                  onClick={() => profileMutation.mutate()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
                >
                  {profileMutation.isPending ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {activeDoc && (
        <DocumentPreview
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          documentId={activeDoc._id || activeDoc.id}
          fileUrl={activeDoc.file_url}
          documentType={activeDoc.document_type || 'Document'}
        />
      )}
    </div>
  );
}
