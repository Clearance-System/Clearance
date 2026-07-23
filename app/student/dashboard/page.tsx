"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyDocuments,
  uploadDocument,
  updateStudentProfile,
  submitClearanceRequest,
  getClearanceStatus,
  downloadClearanceSlip,
} from "@/api/student";
import { FileUpload } from "@/components/FileUpload";
import { DocumentPreview } from "@/components/DocumentPreview";
import { useAuth } from "@/context/AuthProvider";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileDown,
  UploadCloud,
  Send,
  Check,
  RefreshCw,
  FileText,
  AlertTriangle,
  Info,
  User as UserIcon,
  Camera,
  PenTool,
  ShieldCheck,
  Lock,
  Sparkles,
  Plus,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";

const REQUIRED_DOC_TYPES = [
  { id: "School Fees Receipt", name: "School Fees Receipt" },
  { id: "Acceptance Fee Receipt", name: "Acceptance Fee Receipt" },
  { id: "Library Card", name: "Library Card" },
  { id: "Student ID Card", name: "Student ID Card" },
  { id: "Departmental Form", name: "Departmental Form" },
  { id: "Alumni Fee Receipt", name: "Alumni Fee Receipt" },
  { id: "Faculty Dues Receipt", name: "Faculty Dues Receipt" },
  { id: "Sports Council Clearance", name: "Sports Council Clearance" },
  { id: "Security Clearance", name: "Security Clearance" },
];

function Toast({ msg, type }: { msg: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed top-20 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all ${
        type === "success" ? "bg-emerald-600" : "bg-rose-600"
      }`}
      style={{ animation: "slideIn 0.3s ease" }}
    >
      {type === "success" ? (
        <Check className="w-4 h-4" />
      ) : (
        <XCircle className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{msg}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normStatus = (status || "").toLowerCase();
  if (normStatus === "approved")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Approved
      </span>
    );
  if (normStatus === "rejected")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20">
        <XCircle className="w-3.5 h-3.5" />
        Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20">
      <Clock className="w-3.5 h-3.5" />
      Pending
    </span>
  );
}

export default function StudentDashboard() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDocType, setSelectedDocType] = useState(
    REQUIRED_DOC_TYPES[0].id,
  );
  const [docFile, setDocFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    id: string;
    url: string;
    type: string;
  } | null>(null);

  // Profile upload form state (for incomplete profile on dashboard)
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Profile completion status check
  const hasSignature = !!user?.signature_url;
  const hasPassport = !!user?.passport_url;
  const isProfileComplete = !!(
    user?.profile_completed &&
    hasSignature &&
    hasPassport
  );
  const signatureChanges = user?.signature_changes || 0;
  const signatureLocked = isProfileComplete && signatureChanges >= 2;

  // Fetch documents
  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["myDocuments"],
    queryFn: getMyDocuments,
    retry: 1,
  });

  // Fetch clearance status
  const {
    data: clearanceStatus,
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ["clearanceStatus"],
    queryFn: getClearanceStatus,
    retry: 1,
  });

  const docs: any[] = documents || [];
  const approved = docs.filter(
    (d) => (d.status || "").toLowerCase() === "approved",
  ).length;
  const pending = docs.filter(
    (d) => (d.status || "").toLowerCase() === "pending",
  ).length;
  const rejected = docs.filter(
    (d) => (d.status || "").toLowerCase() === "rejected",
  ).length;
  const total = docs.length;

  // Check unique required documents uploaded
  const uploadedDocTypes = Array.from(
    new Set(
      docs
        .filter((d) => (d.status || "").toLowerCase() !== "rejected")
        .map((d) => d.document_type || d.type),
    ),
  );

  const missingRequiredDocs = REQUIRED_DOC_TYPES.filter(
    (req) => !uploadedDocTypes.includes(req.id),
  );

  const uniqueRequiredUploadedCount =
    REQUIRED_DOC_TYPES.length - missingRequiredDocs.length;
  const all9DocsAdded = missingRequiredDocs.length === 0;

  const requiredCount = clearanceStatus?.required_count || 9;
  const isFullyCleared =
    !!clearanceStatus?.all_approved || approved >= requiredCount;
  const pct = Math.min(100, Math.round((approved / requiredCount) * 100));

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: updateStudentProfile,
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["clearanceStatus"] });
      setSignatureFile(null);
      setPassportFile(null);
      showToast("Profile completed successfully!", "success");
    },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail;
      const errorMsg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail[0]?.msg
            : e?.message || "Profile update failed.";
      showToast(errorMsg, "error");
    },
  });

  // Submit profile setup (first time on dashboard)
  const handleProfileSubmit = () => {
    const willHaveSig = !!signatureFile || hasSignature;
    const willHavePassport = !!passportFile || hasPassport;

    if (!willHaveSig || !willHavePassport) {
      showToast(
        "Both signature and passport photo are required to complete your profile",
        "error",
      );
      return;
    }

    profileMutation.mutate({
      signatureFile: signatureFile || undefined,
      passportFile: passportFile || undefined,
    });
  };

  // Upload document mutation
  const docMutation = useMutation({
    mutationFn: ({ type, file }: { type: string; file: File }) =>
      uploadDocument(type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myDocuments"] });
      queryClient.invalidateQueries({ queryKey: ["clearanceStatus"] });
      setDocFile(null);
      showToast("Document added successfully!", "success");
    },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail;
      const errorMsg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail[0]?.msg
            : e?.message || "Upload failed.";
      showToast(errorMsg, "error");
    },
  });

  const handleAddDocument = () => {
    if (!docFile) {
      showToast("Please select a document file to upload first.", "error");
      return;
    }
    docMutation.mutate({ type: selectedDocType, file: docFile });
  };

  // Submit clearance request mutation
  const submitMutation = useMutation({
    mutationFn: submitClearanceRequest,
    onSuccess: () => {
      refetchStatus();
      showToast("Clearance request submitted successfully!", "success");
    },
    onError: (e: any) => {
      const detail = e?.response?.data?.detail;
      const errorMsg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail[0]?.msg
            : e?.message || "Submission failed.";
      showToast(errorMsg, "error");
    },
  });

  const handleClearanceSubmission = () => {
    if (!isProfileComplete || !hasSignature || !hasPassport) {
      showToast(
        "Both signature and passport photo are required to complete your profile before submitting clearance.",
        "error",
      );
      return;
    }
    if (!all9DocsAdded) {
      showToast(
        `All 9 required documents must be uploaded before submitting (Currently ${uniqueRequiredUploadedCount}/9 added).`,
        "error",
      );
      return;
    }
    submitMutation.mutate();
  };

  // Download slip mutation
  const slipMutation = useMutation({
    mutationFn: downloadClearanceSlip,
    onSuccess: () => showToast("Clearance slip downloaded!", "success"),
    onError: (e: any) => {
      const detail = e?.response?.data?.detail;
      const errorMsg =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail[0]?.msg
            : e?.message || "Download failed.";
      showToast(errorMsg, "error");
    },
  });

  const canDownloadSlip =
    isProfileComplete && hasSignature && hasPassport && isFullyCleared;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl translate-x-12 -translate-y-12" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-3xl font-extrabold tracking-tight">
                Student Clearance Dashboard
              </h1>
              {isProfileComplete ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Profile Complete
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Profile Setup Incomplete
                </span>
              )}
            </div>
            <p className="text-indigo-200 text-sm">
              Welcome,{" "}
              <span className="font-semibold text-white">
                {user?.name ||
                  `${user?.first_name || ""} ${user?.last_name || ""}`}
              </span>
              {user?.matric_number && (
                <span className="ml-2 text-indigo-300">
                  · {user.matric_number}
                </span>
              )}
              {user?.faculty && (
                <span className="ml-2 text-indigo-300">· {user.faculty}</span>
              )}
              {user?.department && (
                <span className="ml-2 text-indigo-300">
                  · {user.department}
                </span>
              )}
            </p>
          </div>

          {/* Banner CTA */}
          {isProfileComplete ? (
            <Link
              href="/student/profile"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 transition-all shadow-sm hover:scale-105"
            >
              <UserIcon className="w-4 h-4 text-indigo-300" />
              View Profile Page
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="bg-amber-500/15 backdrop-blur-md p-4 rounded-2xl border border-amber-400/30 text-amber-200 text-xs max-w-sm">
              <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Action Required
              </div>
              Both signature and passport photo are required to complete your
              profile setup below before clearance submission.
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Total Uploaded", val: total, color: "bg-white/10" },
            { label: "Approved", val: approved, color: "bg-emerald-500/20" },
            { label: "Pending", val: pending, color: "bg-yellow-500/20" },
            { label: "Rejected", val: rejected, color: "bg-rose-500/20" },
          ].map(({ label, val, color }) => (
            <div
              key={label}
              className={`${color} backdrop-blur-md rounded-2xl p-4 border border-white/10`}
            >
              <p className="text-xs text-indigo-200 uppercase font-bold tracking-wider">
                {label}
              </p>
              <p className="text-2xl font-bold mt-1">{val}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-indigo-200 font-bold mb-1">
            <span>
              CLEARANCE PROGRESS ({approved} of {requiredCount} Approved)
            </span>
            <span>{pct}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-indigo-400 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Clearance Status Banner */}
      {clearanceStatus && (
        <div
          className={`p-5 rounded-2xl border flex items-start gap-4 ${
            clearanceStatus.status === "completed" ||
            clearanceStatus.status === "cleared"
              ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30"
              : clearanceStatus.status === "rejected"
                ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30"
                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30"
          }`}
        >
          {clearanceStatus.status === "completed" ||
          clearanceStatus.status === "cleared" ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : clearanceStatus.status === "rejected" ? (
            <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Info className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-bold text-sm capitalize text-zinc-800 dark:text-zinc-200">
              Clearance Status:{" "}
              {(clearanceStatus.status || "Not Submitted")?.replace(/_/g, " ")}
            </p>
            {clearanceStatus.message && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                {clearanceStatus.message}
              </p>
            )}
          </div>
          <button
            onClick={() => refetchStatus()}
            className="ml-auto p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CONDITIONAL RENDERING: Student Profile Details & Setup Card ONLY when profile is INCOMPLETE */}
      {!isProfileComplete && (
        <div className="bg-white dark:bg-zinc-900 border-2 border-amber-400/40 dark:border-amber-500/30 rounded-3xl p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Complete Profile Setup
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Both signature and passport photo are compulsory for first-time
                profile completion.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-900/30">
              Setup Pending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Passport Photo Box */}
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-500" /> Passport
                Photo <span className="text-rose-500">*</span>
              </p>
              {user?.passport_url ? (
                <div className="relative group">
                  <img
                    src={user.passport_url}
                    alt="Student Passport Photo"
                    className="w-28 h-36 object-cover rounded-xl border-2 border-indigo-500/30 shadow-md transition-transform group-hover:scale-105"
                  />
                  <span className="absolute bottom-2 right-2 p-1 bg-emerald-500 text-white rounded-full shadow-sm">
                    <Check className="w-3 h-3" />
                  </span>
                </div>
              ) : (
                <div className="w-28 h-36 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-400">
                  <Camera className="w-8 h-8 mb-2 text-zinc-400" />
                  <span className="text-[11px] font-semibold">
                    Missing Passport
                  </span>
                </div>
              )}
              <div className="w-full mt-3">
                <FileUpload
                  onFileSelect={(f) => setPassportFile(f)}
                  label={
                    passportFile
                      ? `Selected: ${passportFile.name}`
                      : user?.passport_url
                        ? "Replace Passport Photo"
                        : "Upload Passport Photo"
                  }
                  accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
                />
              </div>
            </div>

            {/* Digital Signature Box */}
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-indigo-500" /> Digital
                Signature <span className="text-rose-500">*</span>
              </p>
              {user?.signature_url ? (
                <div className="relative w-44 h-24 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2 flex items-center justify-center shadow-inner">
                  <img
                    src={user.signature_url}
                    alt="Student Signature"
                    className="max-h-full max-w-full object-contain"
                  />
                  <span className="absolute bottom-1 right-1 p-1 bg-emerald-500 text-white rounded-full shadow-sm">
                    <Check className="w-3 h-3" />
                  </span>
                </div>
              ) : (
                <div className="w-44 h-24 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center p-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-400">
                  <PenTool className="w-8 h-8 mb-1 text-zinc-400" />
                  <span className="text-[11px] font-semibold">
                    Missing Signature
                  </span>
                </div>
              )}
              <div className="w-full mt-3">
                <FileUpload
                  onFileSelect={(f) => setSignatureFile(f)}
                  label={
                    signatureFile
                      ? `Selected: ${signatureFile.name}`
                      : user?.signature_url
                        ? "Replace Signature Image"
                        : "Upload Signature Image"
                  }
                  accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
                />
              </div>
            </div>

            {/* Student Details Summary & Action */}
            <div className="space-y-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between h-full">
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase">
                    Full Name
                  </p>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    {user?.name ||
                      `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                      "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase">
                    Matric Number
                  </p>
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    {user?.matric_number || "—"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400 uppercase">
                      Faculty
                    </p>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      {user?.faculty || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-400 uppercase">
                      Department
                    </p>
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      {user?.department || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProfileSubmit}
                disabled={profileMutation.isPending}
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-all shadow-md shadow-amber-600/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-4 h-4" />
                {profileMutation.isPending
                  ? "Saving Profile…"
                  : "Complete Profile Setup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Uploads + Documents List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Document Upload Panel */}
        <div className="space-y-6 lg:col-span-1">
          {/* Clearance Document Upload Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-500" />
                Add Clearance Document
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Select document type, attach file, and click{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  Add Document
                </span>{" "}
                to upload.
              </p>
            </div>

            {/* Document Type Dropdown */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Select Document Type ({uniqueRequiredUploadedCount}/9 Added)
              </label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-medium"
              >
                {REQUIRED_DOC_TYPES.map((t) => {
                  const isUploaded = uploadedDocTypes.includes(t.id);
                  return (
                    <option key={t.id} value={t.id}>
                      {isUploaded ? `✓ ${t.name} (Uploaded)` : t.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* File Dropzone */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Attach File
              </label>
              <FileUpload
                onFileSelect={(f) => setDocFile(f)}
                label={
                  docFile
                    ? `Selected: ${docFile.name}`
                    : `Select file for ${REQUIRED_DOC_TYPES.find((d) => d.id === selectedDocType)?.name}`
                }
              />
            </div>

            {/* Explicit Add Document Button */}
            <button
              onClick={handleAddDocument}
              disabled={docMutation.isPending || !docFile}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {docMutation.isPending ? "Uploading Document…" : "Add Document"}
            </button>
          </div>

          {/* Required Documents Checklist */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Required Documents Checklist
              </h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                {uniqueRequiredUploadedCount} / 9
              </span>
            </div>
            <div className="space-y-2 text-xs">
              {REQUIRED_DOC_TYPES.map((req) => {
                const isUploaded = uploadedDocTypes.includes(req.id);
                return (
                  <div
                    key={req.id}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      isUploaded
                        ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    <span className="font-medium truncate">{req.name}</span>
                    {isUploaded ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                        Missing
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Submitted Documents & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documents List Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                Submitted Documents
              </h3>
              <span className="text-xs text-zinc-500 font-semibold">
                Total: {docs.length} uploaded
              </span>
            </div>
            {docsLoading ? (
              <div className="text-center py-12 text-zinc-400 animate-pulse">
                Loading documents…
              </div>
            ) : docs.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <UploadCloud className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                <p className="text-sm font-medium text-zinc-500">
                  No documents uploaded yet
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Select a document type, attach your file, and click "Add
                  Document"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((doc: any) => (
                  <div
                    key={doc._id || doc.id}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm capitalize">
                          {(doc.document_type || doc.type || "").replace(
                            /_/g,
                            " ",
                          )}
                        </p>
                        <StatusBadge status={doc.status} />
                      </div>
                      <p className="text-xs text-zinc-400">
                        Uploaded:{" "}
                        {doc.created_at || doc.uploaded_at
                          ? new Date(
                              doc.created_at || doc.uploaded_at,
                            ).toLocaleDateString()
                          : "Recently"}
                      </p>
                      {doc.remark && (
                        <div className="mt-2 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            Remark:
                          </p>
                          <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                            {doc.remark}
                          </p>
                        </div>
                      )}
                    </div>

                    {doc.file_url && (
                      <div className="mt-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
                        <button
                          onClick={() => {
                            setPreviewDoc({
                              id: doc.id || doc._id,
                              url: doc.file_url,
                              type: doc.document_type || doc.type || "Document",
                            });
                            setPreviewOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Document
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Clearance & Download Slip Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1">
                Submit Clearance & Download Slip
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ensure your profile is complete and all 9 required documents are
                added to submit clearance request.
              </p>
            </div>

            {!isProfileComplete && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Profile setup incomplete: You must upload both your signature
                  and passport photo before submitting clearance.
                </span>
              </div>
            )}

            {!all9DocsAdded && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Missing required documents: You have added{" "}
                  {uniqueRequiredUploadedCount} of 9 required documents. Upload
                  the remaining {missingRequiredDocs.length} documents using the
                  panel on the left.
                </span>
              </div>
            )}

            {!isFullyCleared && rejected > 0 && (
              <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/20">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Some documents were rejected. Re-upload corrected files before
                  submitting.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleClearanceSubmission}
                disabled={
                  submitMutation.isPending ||
                  !all9DocsAdded ||
                  !isProfileComplete
                }
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <Send className="w-4 h-4" />
                {submitMutation.isPending
                  ? "Submitting Request…"
                  : "Submit Clearance Request"}
              </button>

              <button
                onClick={() => slipMutation.mutate()}
                disabled={!canDownloadSlip || slipMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
              >
                <FileDown className="w-4 h-4" />
                {slipMutation.isPending
                  ? "Downloading…"
                  : "Download Clearance Slip"}
              </button>
            </div>

            {!canDownloadSlip && (
              <p className="text-[11px] text-zinc-400 text-center italic">
                * Slip download is enabled once your profile setup is complete
                (passport & signature) and all 9 required documents are approved
                by staff.
              </p>
            )}
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
