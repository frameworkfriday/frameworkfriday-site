"use client";

import { X, Shield, Lock, Eye, ShieldCheck, Building2 } from "lucide-react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    icon: Lock,
    title: "Your Claude Project",
    color: "text-green-600",
    points: [
      "Lives in your personal Claude account — we cannot see, access, or retrieve anything inside it.",
      "All conversations, uploaded files, and generated artifacts remain under your control.",
      "With a Pro/Team account, Anthropic does not use your conversations for training.",
    ],
  },
  {
    icon: Eye,
    title: "Your Deliverables",
    color: "text-blue-600",
    points: [
      "We only see what you submit through the deliverable form.",
      "Access is limited to: Fred Butson (Facilitator), Ali Asghar, Jebby, and Lucas Robinson.",
      "Retained for 30 days after your sprint, then permanently deleted.",
      "We will always ask before using your work for any other purpose.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Sensitive Information",
    color: "text-amber-600",
    points: [
      "You may anonymize anything — use role titles, generic descriptions, and placeholders.",
      "Anonymizing does not affect your grade. We evaluate your thinking, not company details.",
      "Avoid pasting passwords, API keys, or financial records into Claude or deliverables.",
    ],
  },
  {
    icon: Building2,
    title: "Enterprise Participants",
    color: "text-purple-600",
    points: [
      "Check with your IT/security team if your organization restricts AI tool usage.",
      "Claude Team plans offer additional security controls for organizations.",
      "We can provide a security overview document upon request.",
    ],
  },
];

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

      <div className="relative w-full max-w-lg mx-4 max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-900 text-white">
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <p className="text-sm text-gray-500">
            Transparency matters. Here&apos;s exactly how your data is handled during the Decision Sprint.
          </p>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <section.icon size={16} className={section.color} />
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.points.map((point, i) => (
                  <li key={i} className="text-sm text-gray-600 leading-relaxed pl-6 relative before:content-[''] before:absolute before:left-2 before:top-[9px] before:w-1 before:h-1 before:rounded-full before:bg-gray-300">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="bg-gray-50 rounded-lg p-3 text-center text-sm text-gray-500">
            Questions?{" "}
            <a
              href="mailto:hello@frameworkfriday.ai"
              className="text-primary font-medium hover:underline"
            >
              hello@frameworkfriday.ai
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
