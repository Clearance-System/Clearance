'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDocumentContent } from '@/api/documents';
import { X, FileText, Loader2, Download, AlertTriangle, ExternalLink } from 'lucide-react';

interface DocumentPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  fileUrl: string;
  documentType: string;
}

export function DocumentPreview({
  isOpen,
  onClose,
  documentId,
  fileUrl,
  documentType,
}: DocumentPreviewProps) {
  const getFileType = (url: string) => {
    if (!url) return 'unknown';
    const cleanUrl = url.toLowerCase().split('?')[0];
    if (cleanUrl.match(/\.(png|jpg|jpeg|webp|gif)$/i)) return 'image';
    if (cleanUrl.endsWith('.pdf')) return 'pdf';
    if (cleanUrl.endsWith('.txt')) return 'text';
    if (cleanUrl.endsWith('.docx')) return 'docx';
    if (cleanUrl.endsWith('.doc')) return 'doc';
    return 'unknown';
  };

  const fileType = getFileType(fileUrl);
  const isFetchNeeded = fileType === 'text' || fileType === 'docx';

  const { data, isLoading, error } = useQuery({
    queryKey: ['documentContent', documentId],
    queryFn: () => getDocumentContent(documentId),
    enabled: isOpen && !!documentId && isFetchNeeded,
    retry: 1,
  });

  if (!isOpen) return null;

  const renderContent = () => {
    if (isFetchNeeded) {
      if (isLoading) {
        return (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-400">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-3" />
            <p className="text-sm font-medium animate-pulse">Extracting document text...</p>
          </div>
        );
      }

      if (error || !data) {
        return (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-550/20">
            <AlertTriangle className="w-10 h-10 text-rose-500 mb-3" />
            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Failed to extract document content</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mb-5">
              We couldn't parse the text from this file. You can still download the file to view it on your device.
            </p>
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download File
            </a>
          </div>
        );
      }

      // Successfully fetched text content
      return (
        <div className="flex flex-col h-full max-h-[60vh]">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>Extracted Text Content</span>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl overflow-y-auto flex-1 select-text">
            {data.content || 'This document has no readable text content.'}
          </pre>
        </div>
      );
    }

    if (fileType === 'image') {
      return (
        <div className="flex items-center justify-center p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-h-[60vh] overflow-hidden">
          <img
            src={fileUrl}
            alt={documentType}
            className="max-h-[55vh] object-contain rounded-xl select-none"
          />
        </div>
      );
    }

    if (fileType === 'pdf') {
      return (
        <div className="w-full h-[60vh] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950">
          <iframe
            src={fileUrl}
            title={documentType}
            className="w-full h-full border-none"
          />
        </div>
      );
    }

    if (fileType === 'doc') {
      // Use Google Docs viewer for .doc
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
      return (
        <div className="space-y-4">
          <div className="w-full h-[58vh] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 relative">
            <iframe
              src={googleViewerUrl}
              title={documentType}
              className="w-full h-full border-none"
            />
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs px-4 py-3 rounded-xl">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              If the document fails to preview, it may be because of Google Docs Viewer rate limits. You can download and view it locally.
            </span>
          </div>
        </div>
      );
    }

    // Unknown or other binary types
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950/20">
        <FileText className="w-12 h-12 text-indigo-500 mb-3" />
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider mb-1">
          {documentType}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mb-6">
          This file format ({fileType.toUpperCase()}) does not support inline system previewing.
        </p>
        <div className="flex gap-3">
          <a
            href={fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download File
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ animation: 'scaleUp 0.2s ease-out' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="min-w-0">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white truncate capitalize">
              {documentType.replace(/_/g, ' ')}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 max-w-[200px] sm:max-w-sm font-mono">
              Type: {fileType.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Header actions */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open Original ↗</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-zinc-50/30 dark:bg-zinc-900/30 min-h-[40vh]">
          {renderContent()}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-end items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-650 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors"
          >
            Close Preview
          </button>
          <a
            href={fileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
