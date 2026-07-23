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
  Image as ImageIcon,
} from "lucide-react";
import { useState } from "react";

const DOC_TYPES = [
  { id: "School Fees Receipt", name: "School Fees Receipt" },
  { id: "Acceptance Fee Receipt", name: "Acceptance Fee Receipt" },
  { id: "Library Card", name: "Library Card" },
  { id: "Student ID Card", name: "Student ID Card" },
  { id: "Departmental Form", name: "Departmental Form" },
  { id: "Hostel Clearance", name: "Hostel Clearance" },
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

  const [selectedDocType, setSelectedDocType] = useState(DOC_TYPES[0].id);
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

  // Profile upload form state
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
      showToast("Profile updated successfully!", "success");
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

  // Submit profile setup or update
  const handleProfileSubmit = () => {
    if (!isProfileComplete) {
      // First-time completion check: requires both signature and passport
      const willHaveSig = !!signatureFile || hasSignature;
      const willHavePassport = !!passportFile || hasPassport;

      if (!willHaveSig || !willHavePassport) {
        showToast(
          "Both signature and passport photo are required to complete your profile",
          "error",
        );
        return;
      }
    } else {
      // Profile already complete: allow updating either or both
      if (!signatureFile && !passportFile) {
        showToast(
          "Please provide either a new signature or a new passport photo to update your profile",
          "error",
        );
        return;
      }
      if (signatureFile && signatureLocked) {
        showToast(
          "You can only change your signature 2 times after initial upload",
          "error",
        );
        return;
      }
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
      showToast("Document uploaded!", "success");
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

  // Submit clearance request mutation
  const submitMutation = useMutation({
    mutationFn: submitClearanceRequest,
    onSuccess: () => {
      refetchStatus();
      showToast("Clearance request submitted!", "success");
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
                  Profile Incomplete
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

          {/* Action shortcut to complete profile if incomplete */}
          {!isProfileComplete && (
            <div className="bg-amber-500/15 backdrop-blur-md p-4 rounded-2xl border border-amber-400/30 text-amber-200 text-xs max-w-sm">
              <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Action Required
              </div>
              Both signature and passport photo are required to complete your
              profile before clearance.
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Total Docs", val: total, color: "bg-white/10" },
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
            <span>CLEARANCE PROGRESS</span>
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

      {/* Student Profile Overview Card (Passport + Signature + Details) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Student Profile Details
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Verify your passport photo and digital signature for clearance
              slip generation.
            </p>
          </div>
          {isProfileComplete ? (
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-emerald-900/30">
              Verified Media
            </span>
          ) : (
            <span className="text-xs font-semibold px-3 py-1 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-900/30">
              Setup Pending
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Passport Photo Box */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-500" /> Passport Photo
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
            <p className="text-[11px] text-zinc-400 mt-2">
              Required on Clearance Slip
            </p>
          </div>

          {/* Digital Signature Box */}
          <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-indigo-500" /> Digital
              Signature
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
            <p className="text-[11px] text-zinc-400 mt-2">
              Updates used:{" "}
              <span className="font-bold text-zinc-600 dark:text-zinc-300">
                {signatureChanges} / 2
              </span>
            </p>
          </div>

          {/* Student Info Details */}
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
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
        </div>
      </div>

      {/* Main Grid: Uploads + Documents List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Setup & Document Upload */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Setup / Update Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                {isProfileComplete
                  ? "Update Profile Media"
                  : "Complete Profile Setup"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {!isProfileComplete
                  ? "Both signature and passport photo are required to complete your profile."
                  : "You can update signature (max 2 times) or passport photo."}
              </p>
            </div>

            {/* Passport Photo Upload Dropzone */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-indigo-500" />
                Passport Photo{" "}
                {!isProfileComplete && <span className="text-rose-500">*</span>}
              </label>
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

            {/* Signature Upload Dropzone */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                Digital Signature{" "}
                {!isProfileComplete && <span className="text-rose-500">*</span>}
              </label>
              {signatureLocked ? (
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>
                    Signature change limit reached (2/2 changes used).
                  </span>
                </div>
              ) : (
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
              )}
            </div>

            {/* Submit Button for Profile */}
            <button
              onClick={handleProfileSubmit}
              disabled={profileMutation.isPending}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              {profileMutation.isPending
                ? "Saving Profile…"
                : isProfileComplete
                  ? "Update Profile"
                  : "Complete Profile Setup"}
            </button>
          </div>

          {/* Clearance Document Upload Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white mb-1 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-500" />
              Upload Clearance Document
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
              Select document type and upload your clearance document receipt.
            </p>

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
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <FileUpload
              onFileSelect={(f) => {
                docMutation.mutate({ type: selectedDocType, file: f });
              }}
              label={`Upload ${DOC_TYPES.find((d) => d.id === selectedDocType)?.name}`}
            />
            {docMutation.isPending && (
              <p className="text-xs text-indigo-400 mt-2 animate-pulse">
                Uploading document…
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Submitted Documents & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Documents List Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-5">
              Submitted Documents
            </h3>
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
                  Upload your required receipts using the panel on the left
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map((doc: any) => (
                  <div
                    key={doc._id || doc.id}
                    className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm capitalize">
                          {(doc.document_type || doc.type || "").replace(
                            /_/g,
                            " ",
                          )}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {doc.created_at || doc.uploaded_at
                            ? new Date(
                                doc.created_at || doc.uploaded_at,
                              ).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                    {doc.remark && (
                      <div className="mt-2 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                          Remark:
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                          {doc.remark}
                        </p>
                      </div>
                    )}
                    {doc.file_url && (
                      <button
                        onClick={() => {
                          setPreviewDoc({
                            id: doc.id || doc._id,
                            url: doc.file_url,
                            type: doc.document_type || doc.type || "Document",
                          });
                          setPreviewOpen(true);
                        }}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View File
                      </button>
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
                Complete your profile and upload all required documents to
                submit clearance request and download slip.
              </p>
            </div>

            {!isProfileComplete && (
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Profile incomplete: You must upload both your signature and
                  passport photo before submitting or downloading slip.
                </span>
              </div>
            )}

            {!isFullyCleared && rejected > 0 && (
              <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/20">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  Some documents were rejected. Re-upload the corrected files
                  before submitting.
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleClearanceSubmission}
                disabled={
                  submitMutation.isPending ||
                  docs.length === 0 ||
                  !isProfileComplete
                }
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <Send className="w-4 h-4" />
                {submitMutation.isPending
                  ? "Submitting…"
                  : "Submit Clearance Request"}
              </button>

              <button
                onClick={() => slipMutation.mutate()}
                disabled={!canDownloadSlip || slipMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10"
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
                (passport & signature) and all 9 required documents are
                approved.
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
