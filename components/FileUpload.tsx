'use client';

import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  label?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  onFileSelect,
  accept = { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] },
  label,
  maxSizeMB = 5,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
    onDrop: (acceptedFiles, fileRejections) => {
      setError(null);
      
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
        } else {
          setError(rejection.errors[0]?.message || 'Invalid file format.');
        }
        return;
      }

      if (acceptedFiles[0]) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative overflow-hidden border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
        }`}
      >
        <input {...getInputProps()} />

        {/* Dynamic Glow effects for active state */}
        {isDragActive && (
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 animate-pulse pointer-events-none" />
        )}

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className={`p-3 rounded-full transition-colors duration-300 ${
            selectedFile 
              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600'
          }`}>
            {selectedFile ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <div>
            {selectedFile ? (
              <div className="space-y-1">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1 max-w-[250px] mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                {label && <p className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{label}</p>}
                {isDragActive ? (
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium">Drop the file here...</p>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Drag & drop a file here, or <span className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">browse</span>
                  </p>
                )}
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                  Accepts PDF or Images (Max {maxSizeMB}MB)
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 mt-2 text-rose-600 dark:text-rose-400 text-xs font-medium bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg border border-rose-100 dark:border-rose-900/30">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
