"use client";

import { X, ExternalLink, Copy } from "lucide-react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  embedUrl: string | null;
  directUrl: string | null;
}

export function SubmitWorkDialog({ open, onClose, embedUrl, directUrl }: Props) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-3xl mx-4 h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Submit Your Work</h2>
          <div className="flex items-center gap-2">
            {directUrl && (
              <>
                <a
                  href={directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink size={12} />
                  Open in new tab
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(directUrl)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Copy link"
                >
                  <Copy size={14} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Embed */}
        <div className="flex-1 overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full border-0"
              title="Submit Work Form"
              allow="clipboard-write"
            />
          ) : directUrl ? (
            <iframe
              src={directUrl}
              className="w-full h-full border-0"
              title="Submit Work Form"
              allow="clipboard-write"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Submission form not available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
