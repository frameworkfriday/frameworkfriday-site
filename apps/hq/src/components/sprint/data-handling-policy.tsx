"use client";

import { X, Shield } from "lucide-react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function DataHandlingPolicy({ open, onClose }: Props) {
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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-900 text-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Shield size={18} />
            <h2 className="font-semibold">Data Handling Policy</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            Transparency matters. Here&apos;s exactly how your data is handled during the Decision Sprint.
          </p>

          {/* Your Claude Project */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">1</span>
              Your Claude Project
            </h3>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />
                  Your Claude Project lives in <strong>your personal Claude account</strong>. Framework Friday cannot see, access, or retrieve anything inside it.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />
                  All conversations, uploaded files, and generated artifacts remain under <strong>your control</strong>.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-green-500 flex-shrink-0" />
                  Anthropic&apos;s data policies apply to your Claude usage. With a Pro/Team account, your conversations are <strong>not used for training</strong>.
                </li>
              </ul>
            </div>
          </div>

          {/* Your Deliverables */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
              Your Deliverables
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                  The only work we see is what you <strong>submit through the deliverable form</strong>.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                  Access is limited to the Framework Friday sprint team: <strong>Fred Butson</strong> (Facilitator), Ali Asghar, Jebby, and Lucas Robinson.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                  Deliverables are <strong>retained for 30 days</strong> after your sprint ends, then permanently deleted.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                  If we ever want to keep your work longer (e.g., as a case study), we will <strong>ask you directly</strong>.
                </li>
              </ul>
            </div>
          </div>

          {/* Protecting Sensitive Information */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">3</span>
              Protecting Sensitive Information
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                  You&apos;re welcome to <strong>anonymize anything</strong> you&apos;re not comfortable sharing.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                  Use role titles, generic descriptions, and placeholder names. It <strong>doesn&apos;t affect your grade</strong> &mdash; we evaluate your thinking, not your company details.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0" />
                  Avoid pasting passwords, API keys, or financial records into your Claude Project or deliverables.
                </li>
              </ul>
            </div>
          </div>

          {/* Enterprise Participants */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">4</span>
              Enterprise Participants
            </h3>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-500 flex-shrink-0" />
                  If your organization has restrictions on AI tool usage, check with your IT/security team before starting.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-500 flex-shrink-0" />
                  Claude Team plans offer additional security controls and admin features for organizations.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-purple-500 flex-shrink-0" />
                  We can provide a security overview document for your team upon request.
                </li>
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">
              Questions about data handling?{" "}
              <a
                href="mailto:hello@frameworkfriday.ai"
                className="text-primary font-medium hover:underline"
              >
                hello@frameworkfriday.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
