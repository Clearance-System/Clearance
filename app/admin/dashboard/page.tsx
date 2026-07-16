'use client';

import React from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllStudents, getStudentById, getUploadedStudentsList,
  getStaffList, getStaffDetail, approveStaff, suspendStaff, unsuspendStaff, deleteStaff,
  getClearanceStatus, toggleClearance,
  uploadStudentsFile, exportCompletedClearances,
} from '@/api/admin';
import { FileUpload } from '@/components/FileUpload';
import {
  CheckCircle2, XCircle, Clock, Search, Eye, X, Check,
  ShieldCheck, Users, Building2, FileDown, UploadCloud,
  ToggleLeft, ToggleRight, Trash2, ShieldOff, ShieldAlert,
  UserCheck, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-20 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      <span>{msg}</span>
    </div>
  );
}

type ActiveTab = 'overview' | 'students' | 'staff' | 'upload';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [studentSearch, setStudentSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [studentSubTab, setStudentSubTab] = useState<'registered' | 'master'>('registered');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Queries ──
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: getAllStudents,
    retry: 1,
    enabled: (activeTab === 'students' && studentSubTab === 'registered') || activeTab === 'overview',
  });

  const { data: uploadedStudents, isLoading: uploadedLoading } = useQuery({
    queryKey: ['adminUploadedStudents'],
    queryFn: getUploadedStudentsList,
    retry: 1,
    enabled: activeTab === 'students' && studentSubTab === 'master',
  });

  const { data: staffList, isLoading: staffLoading } = useQuery({
    queryKey: ['adminStaff'],
    queryFn: getStaffList,
    retry: 1,
  });

  const { data: clearanceStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['adminClearanceStatus'],
    queryFn: getClearanceStatus,
    retry: 1,
  });

  const { data: studentDetail } = useQuery({
    queryKey: ['studentDetail', selectedStudent],
    queryFn: () => getStudentById(selectedStudent!),
    enabled: !!selectedStudent,
    retry: 1,
  });

  const { data: staffDetail } = useQuery({
    queryKey: ['staffDetail', selectedStaff],
    queryFn: () => getStaffDetail(selectedStaff!),
    enabled: !!selectedStaff,
    retry: 1,
  });

  const allStudents: any[] = students || [];
  const allStaff: any[] = staffList || [];

  // Derived stats
  const totalStudents = allStudents.length;
  const clearedStudents = allStudents.filter((s) => s.clearance_status === 'cleared').length;
  const pendingStudents = allStudents.filter((s) => s.clearance_status === 'pending' || !s.clearance_status).length;
  const approvedStaff = allStaff.filter((s) => s.approved).length;
  const pendingStaff = allStaff.filter((s) => !s.approved).length;

  // ── Mutations ──
  const toggleMutation = useMutation({
    mutationFn: (pause: boolean) => toggleClearance(pause),
    onSuccess: () => { refetchStatus(); showToast('Clearance status toggled!', 'success'); },
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Toggle failed.', 'error'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveStaff(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminStaff'] }); showToast('Staff approved!', 'success'); },
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Approval failed.', 'error'),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendStaff(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminStaff'] }); showToast('Staff suspended.', 'success'); },
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Suspend failed.', 'error'),
  });

  const unsuspendMutation = useMutation({
    mutationFn: (id: string) => unsuspendStaff(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['adminStaff'] }); showToast('Staff unsuspended!', 'success'); },
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Unsuspend failed.', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStaff'] });
      setDeleteConfirm(null);
      showToast('Staff account deleted.', 'success');
    },
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Delete failed.', 'error'),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!uploadFile) throw new Error('Please select a file.');
      return uploadStudentsFile(uploadFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      setUploadFile(null);
      showToast('Students uploaded successfully!', 'success');
    },
    onError: (e: any) => showToast(e?.response?.data?.detail || e?.message || 'Upload failed.', 'error'),
  });

  const exportMutation = useMutation({
    mutationFn: exportCompletedClearances,
    onSuccess: () => showToast('Export downloaded!', 'success'),
    onError: (e: any) => showToast(e?.response?.data?.detail || 'Export failed.', 'error'),
  });

  const filteredStudents = allStudents.filter((s) => {
    const q = studentSearch.toLowerCase();
    return !q || (s.name || '').toLowerCase().includes(q) || (s.matric_number || '').toLowerCase().includes(q) || (s.faculty || '').toLowerCase().includes(q);
  });

  const allUploadedStudents: any[] = uploadedStudents || [];
  const filteredUploaded = allUploadedStudents.filter((s) => {
    const q = studentSearch.toLowerCase();
    return !q || (s.name || '').toLowerCase().includes(q) || (s.matric_number || '').toLowerCase().includes(q) || (s.faculty || '').toLowerCase().includes(q);
  });

  const filteredStaff = allStaff.filter((s) => {
    const q = staffSearch.toLowerCase();
    const fullName = `${s.title || ''} ${s.first_name || ''} ${s.last_name || ''}`.toLowerCase();
    return !q || fullName.includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  const tabs: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: ShieldCheck },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'staff', label: 'Staff', icon: UserCheck },
    { id: 'upload', label: 'Upload & Export', icon: UploadCloud },
  ];

  const clearanceOpen = clearanceStatus?.is_open ?? clearanceStatus?.open ?? null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-x-12 -translate-y-12" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-7 h-7 text-indigo-400" />
              <h1 className="text-2xl font-extrabold tracking-tight">System Admin Console</h1>
            </div>
            <p className="text-zinc-400 text-sm">Manage students, staff accounts, and clearance settings.</p>
          </div>
          {/* Clearance Toggle */}
          <div className="flex items-center gap-4 bg-zinc-800 border border-zinc-700 px-5 py-3 rounded-2xl">
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Clearance Portal</p>
              <p className={`text-sm font-bold mt-0.5 ${clearanceOpen ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {clearanceOpen === null ? 'Loading…' : clearanceOpen ? 'ACTIVE / ON' : 'PAUSED / OFF'}
              </p>
            </div>
            <button
              onClick={() => toggleMutation.mutate(!!clearanceOpen)}
              disabled={toggleMutation.isPending || clearanceOpen === null}
              className="relative focus:outline-none disabled:opacity-50 select-none cursor-pointer"
              aria-label="Toggle Portal Status"
            >
              <div className={`w-14 h-7 rounded-full transition-colors duration-300 relative ${clearanceOpen ? 'bg-emerald-500' : 'bg-zinc-600'}`}>
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${clearanceOpen ? 'translate-x-7' : 'translate-x-0'} flex items-center justify-center`}>
                  {toggleMutation.isPending && (
                    <RefreshCw className="w-3 h-3 text-zinc-600 animate-spin" />
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto scrollbar-hide space-x-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-2xl mb-8 min-w-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 flex-shrink-0 sm:flex-1 justify-center px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" /><span className="whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Students', val: totalStudents, icon: Users, color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Cleared', val: clearedStudents, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'In Progress', val: pendingStudents, icon: Clock, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Active Staff', val: approvedStaff, icon: UserCheck, color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Pending Staff', val: pendingStaff, icon: ShieldAlert, color: 'text-rose-600 dark:text-rose-400' },
            ].map(({ label, val, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                <Icon className={`w-5 h-5 ${color} mb-2`} />
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{val}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Quick pending staff approvals */}
          {pendingStaff > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Pending Staff Approvals ({pendingStaff})
              </h3>
              <div className="space-y-3">
                {allStaff.filter((s) => !s.approved).slice(0, 5).map((staff: any) => (
                  <div key={staff._id || staff.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div>
                      <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                        {staff.title} {staff.first_name} {staff.last_name}
                      </p>
                      <p className="text-xs text-zinc-400">{staff.email}</p>
                    </div>
                    <button
                      onClick={() => approveMutation.mutate(staff._id || staff.id)}
                      disabled={approveMutation.isPending}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      Approve
                    </button>
                  </div>
                ))}
                {pendingStaff > 5 && (
                  <button onClick={() => setActiveTab('staff')} className="text-xs text-indigo-500 hover:underline font-semibold">
                    View all {pendingStaff} pending staff →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STUDENTS TAB ── */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          {/* Sub Tab Switcher */}
          <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl mb-6 max-w-xs border border-zinc-200 dark:border-zinc-800/80">
            <button
              onClick={() => setStudentSubTab('registered')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                studentSubTab === 'registered'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Registered
            </button>
            <button
              onClick={() => setStudentSubTab('master')}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                studentSubTab === 'master'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Master List
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              {studentSubTab === 'registered' ? `Registered Student Accounts (${totalStudents})` : `Uploaded Master List (${allUploadedStudents.length})`}
            </h3>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search name, matric, faculty…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {studentSubTab === 'master' ? (
            uploadedLoading ? (
              <div className="text-center py-16 text-zinc-400 animate-pulse">Loading master list…</div>
            ) : filteredUploaded.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                No uploaded students found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
                  <thead className="text-xs text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-950/40">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Name</th>
                      <th className="px-5 py-3.5 font-bold">Matric No.</th>
                      <th className="px-5 py-3.5 font-bold">Faculty</th>
                      <th className="px-5 py-3.5 font-bold">Department</th>
                      <th className="px-5 py-3.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {filteredUploaded.map((student: any) => {
                      const hasAccount = allStudents.some((reg) => reg.matric_number === student.matric_number);
                      return (
                        <tr key={student._id || student.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="px-5 py-4 font-semibold text-zinc-800 dark:text-zinc-200">{student.name}</td>
                          <td className="px-5 py-4 font-mono text-xs">{student.matric_number}</td>
                          <td className="px-5 py-4 text-xs">{student.faculty}</td>
                          <td className="px-5 py-4 text-xs">{student.department}</td>
                          <td className="px-5 py-4">
                            {hasAccount ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-550/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                                Registered
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800/30 text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-700/20">
                                Unregistered
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            studentsLoading ? (
              <div className="text-center py-16 text-zinc-400 animate-pulse">Loading students…</div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                No students found.
              </div>
            ) : (
              <div className="overflow-x-auto -mx-1">
                {/* Desktop table */}
                <table className="hidden md:table w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
                  <thead className="text-xs text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-950/40">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Name</th>
                      <th className="px-5 py-3.5 font-bold">Matric No.</th>
                      <th className="px-5 py-3.5 font-bold">Faculty</th>
                      <th className="px-5 py-3.5 font-bold">Department</th>
                      <th className="px-5 py-3.5 font-bold">Status</th>
                      <th className="px-5 py-3.5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {filteredStudents.map((student: any) => {
                      const sid = student._id || student.id;
                      return (
                        <React.Fragment key={sid}>
                          <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="px-5 py-4 font-semibold text-zinc-800 dark:text-zinc-200">{student.name}</td>
                            <td className="px-5 py-4 font-mono text-xs">{student.matric_number}</td>
                            <td className="px-5 py-4 text-xs">{student.faculty}</td>
                            <td className="px-5 py-4 text-xs">{student.department}</td>
                            <td className="px-5 py-4">
                              {student.clearance_status === 'cleared'
                                ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20"><CheckCircle2 className="w-3 h-3" />Cleared</span>
                                : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20"><Clock className="w-3 h-3" />{student.clearance_status || 'Pending'}</span>
                              }
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button onClick={() => setSelectedStudent(selectedStudent === sid ? null : sid)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all">
                                <Eye className="w-3.5 h-3.5" />{selectedStudent === sid ? 'Hide' : 'Details'}
                              </button>
                            </td>
                          </tr>
                          {selectedStudent === sid && studentDetail && (
                            <tr>
                              <td colSpan={6} className="px-5 pb-4">
                                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Clearance Documents</p>
                                  {studentDetail.documents?.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      {studentDetail.documents.map((doc: any) => (
                                        <div key={doc._id || doc.id} className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 capitalize mb-1">{(doc.document_type || '').replace(/_/g, ' ')}</p>
                                          {doc.status === 'approved' && <span className="text-xs text-emerald-600 font-semibold">✓ Approved</span>}
                                          {doc.status === 'rejected' && <span className="text-xs text-rose-600 font-semibold">✗ Rejected</span>}
                                          {doc.status === 'pending' && <span className="text-xs text-amber-600 font-semibold">⏳ Pending</span>}
                                        </div>
                                      ))}
                                    </div>
                                  ) : <p className="text-xs text-zinc-400">No documents uploaded yet.</p>}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                {/* Mobile cards */}
                <div className="md:hidden space-y-3 px-1">
                  {filteredStudents.map((student: any) => {
                    const sid = student._id || student.id;
                    return (
                      <div key={sid} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200">{student.name}</p>
                            <p className="font-mono text-xs text-zinc-500 mt-0.5">{student.matric_number}</p>
                          </div>
                          {student.clearance_status === 'cleared'
                            ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 flex-shrink-0"><CheckCircle2 className="w-3 h-3" />Cleared</span>
                            : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 flex-shrink-0"><Clock className="w-3 h-3" />{student.clearance_status || 'Pending'}</span>
                          }
                        </div>
                        <p className="text-xs text-zinc-400 mb-1">{student.faculty}</p>
                        <p className="text-xs text-zinc-400 mb-3">{student.department}</p>
                        <button onClick={() => setSelectedStudent(selectedStudent === sid ? null : sid)}
                          className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all">
                          <Eye className="w-3.5 h-3.5" />{selectedStudent === sid ? 'Hide Details' : 'View Details'}
                        </button>
                        {selectedStudent === sid && studentDetail && (
                          <div className="mt-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Clearance Documents</p>
                            {studentDetail.documents?.length > 0 ? (
                              <div className="grid grid-cols-2 gap-2">
                                {studentDetail.documents.map((doc: any) => (
                                  <div key={doc._id || doc.id} className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 capitalize mb-0.5">{(doc.document_type || '').replace(/_/g, ' ')}</p>
                                    {doc.status === 'approved' && <span className="text-xs text-emerald-600 font-semibold">✓ Approved</span>}
                                    {doc.status === 'rejected' && <span className="text-xs text-rose-600 font-semibold">✗ Rejected</span>}
                                    {doc.status === 'pending' && <span className="text-xs text-amber-600 font-semibold">⏳ Pending</span>}
                                  </div>
                                ))}
                              </div>
                            ) : <p className="text-xs text-zinc-400">No documents uploaded yet.</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* ── STAFF TAB ── */}
      {activeTab === 'staff' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-500" />Staff Management ({allStaff.length})
            </h3>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input type="text" placeholder="Search name or email…" value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
            </div>
          </div>

          {staffLoading ? (
            <div className="text-center py-16 text-zinc-400 animate-pulse">Loading staff…</div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">No staff found.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-500 dark:text-zinc-400">
                  <thead className="text-xs text-zinc-600 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-950/40">
                    <tr>
                      <th className="px-5 py-3.5 font-bold">Officer</th>
                      <th className="px-5 py-3.5 font-bold">Email</th>
                      <th className="px-5 py-3.5 font-bold">Post Held</th>
                      <th className="px-5 py-3.5 font-bold">Status</th>
                      <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    {filteredStaff.map((staff: any) => {
                      const id = staff._id || staff.id;
                      const isSuspended = staff.suspended;
                      const isApproved = staff.approved;
                      const isExpanded = selectedStaff === id;
                      return (
                        <React.Fragment key={id}>
                          <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-zinc-800 dark:text-zinc-200">{staff.title} {staff.first_name} {staff.last_name}</p>
                              {staff.profile_completed && <span className="text-[10px] text-emerald-500 font-semibold">Profile Complete</span>}
                            </td>
                            <td className="px-5 py-4 text-xs">{staff.email}</td>
                            <td className="px-5 py-4 text-xs text-zinc-600 dark:text-zinc-400">{staff.post_held || '—'}</td>
                            <td className="px-5 py-4">
                              {isSuspended
                                ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20"><ShieldOff className="w-3 h-3" />Suspended</span>
                                : isApproved
                                ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20"><CheckCircle2 className="w-3 h-3" />Active</span>
                                : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20"><Clock className="w-3 h-3" />Pending</span>
                              }
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2 flex-wrap">
                                <button onClick={() => setSelectedStaff(isExpanded ? null : id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all">
                                  <Eye className="w-3.5 h-3.5" />{isExpanded ? 'Hide' : 'Details'}
                                </button>
                                {!isApproved && !isSuspended && (
                                  <button onClick={() => approveMutation.mutate(id)} disabled={approveMutation.isPending}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all">Approve</button>
                                )}
                                {isApproved && !isSuspended && (
                                  <button onClick={() => suspendMutation.mutate(id)} disabled={suspendMutation.isPending}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-900/30 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all">
                                    <ShieldOff className="w-3.5 h-3.5" />Suspend
                                  </button>
                                )}
                                {isSuspended && (
                                  <button onClick={() => unsuspendMutation.mutate(id)} disabled={unsuspendMutation.isPending}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold transition-all">
                                    <ShieldAlert className="w-3.5 h-3.5" />Unsuspend
                                  </button>
                                )}
                                <button onClick={() => setDeleteConfirm(id)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all">
                                  <Trash2 className="w-3.5 h-3.5" />Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && staffDetail && (
                            <tr>
                              <td colSpan={5} className="px-5 pb-4">
                                <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5">
                                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Staff Profile Detail</p>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Full Name</p><p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{staffDetail.title} {staffDetail.first_name} {staffDetail.last_name}</p></div>
                                    <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Email</p><p className="text-sm text-zinc-600 dark:text-zinc-400">{staffDetail.email}</p></div>
                                    <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Post Held</p><p className="text-sm text-zinc-600 dark:text-zinc-400">{staffDetail.post_held || '—'}</p></div>
                                    {staffDetail.faculty && <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Faculty</p><p className="text-sm text-zinc-600 dark:text-zinc-400">{staffDetail.faculty}</p></div>}
                                    <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Staff ID</p><p className="text-xs font-mono text-zinc-500">{staffDetail.staff_id || staffDetail._id || id}</p></div>
                                    {staffDetail.signature_url && <div><p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Signature</p><img src={staffDetail.signature_url} alt="Staff Signature" className="h-12 object-contain border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white p-1" /></div>}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filteredStaff.map((staff: any) => {
                  const id = staff._id || staff.id;
                  const isSuspended = staff.suspended;
                  const isApproved = staff.approved;
                  const isExpanded = selectedStaff === id;
                  return (
                    <div key={id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{staff.title} {staff.first_name} {staff.last_name}</p>
                          <p className="text-xs text-zinc-400 truncate">{staff.email}</p>
                          {staff.post_held && <p className="text-xs text-indigo-500 font-medium mt-0.5">{staff.post_held}</p>}
                        </div>
                        {isSuspended
                          ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 flex-shrink-0"><ShieldOff className="w-3 h-3" />Suspended</span>
                          : isApproved
                          ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0"><CheckCircle2 className="w-3 h-3" />Active</span>
                          : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100 flex-shrink-0"><Clock className="w-3 h-3" />Pending</span>
                        }
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button onClick={() => setSelectedStaff(isExpanded ? null : id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-all">
                          <Eye className="w-3.5 h-3.5" />{isExpanded ? 'Hide' : 'Details'}
                        </button>
                        {!isApproved && !isSuspended && (
                          <button onClick={() => approveMutation.mutate(id)} disabled={approveMutation.isPending}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all">Approve</button>
                        )}
                        {isApproved && !isSuspended && (
                          <button onClick={() => suspendMutation.mutate(id)} disabled={suspendMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 text-xs font-bold transition-all">
                            <ShieldOff className="w-3.5 h-3.5" />Suspend
                          </button>
                        )}
                        {isSuspended && (
                          <button onClick={() => unsuspendMutation.mutate(id)} disabled={unsuspendMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 text-xs font-bold transition-all">
                            <ShieldAlert className="w-3.5 h-3.5" />Unsuspend
                          </button>
                        )}
                        <button onClick={() => setDeleteConfirm(id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-xs font-bold transition-all">
                          <Trash2 className="w-3.5 h-3.5" />Delete
                        </button>
                      </div>
                      {isExpanded && staffDetail && (
                        <div className="mt-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Profile Detail</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div><p className="text-[10px] font-bold text-zinc-400 uppercase mb-0.5">Staff ID</p><p className="text-xs font-mono text-zinc-500">{staffDetail.staff_id || id}</p></div>
                            <div><p className="text-[10px] font-bold text-zinc-400 uppercase mb-0.5">Post Held</p><p className="text-xs text-zinc-600 dark:text-zinc-400">{staffDetail.post_held || '—'}</p></div>
                            {staffDetail.faculty && <div className="col-span-2"><p className="text-[10px] font-bold text-zinc-400 uppercase mb-0.5">Faculty</p><p className="text-xs text-zinc-600 dark:text-zinc-400">{staffDetail.faculty}</p></div>}
                            {staffDetail.signature_url && <div className="col-span-2"><p className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5">Signature</p><img src={staffDetail.signature_url} alt="Signature" className="h-10 object-contain border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white p-1" /></div>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── UPLOAD & EXPORT TAB ── */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bulk upload students */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-500" />Bulk Upload Students
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              Upload an Excel (.xlsx) or CSV file with student records. Columns required: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">name, matric_number, faculty, department, password</code>.
            </p>
            <FileUpload
              onFileSelect={(f) => setUploadFile(f)}
              label="Select Excel or CSV file"
              accept={{ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] }}
            />
            <button
              onClick={() => uploadMutation.mutate()}
              disabled={!uploadFile || uploadMutation.isPending}
              className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
            >
              <UploadCloud className="w-4 h-4" />
              {uploadMutation.isPending ? 'Uploading…' : 'Upload Students File'}
            </button>
          </div>

          {/* Export completed clearances */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
              <FileDown className="w-5 h-5 text-emerald-500" />Export Completed Clearances
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
              Download an Excel spreadsheet listing all students who have completed the clearance process, including their document statuses.
            </p>
            <div className="flex items-center justify-center h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl mb-5 text-zinc-400">
              <div className="text-center">
                <FileDown className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">Completed clearance data will be exported as .xlsx</p>
              </div>
            </div>
            <button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-600/10"
            >
              <FileDown className="w-4 h-4" />
              {exportMutation.isPending ? 'Exporting…' : 'Export Completed Clearances (.xlsx)'}
            </button>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ animation: 'scaleUp .2s ease' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Delete Staff Account?</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
              This action is <strong>irreversible</strong>. The staff account and all associated data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition-all disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
                {deleteMutation.isPending ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
