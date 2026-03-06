"use client";

import Image from "next/image";
import { Mail, Menu, X } from "lucide-react";
import { useState } from "react";

interface Props {
  dateRange: string;
}

export function SprintHeader({ dateRange }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Decision Sprint" width={32} height={32} className="text-gray-900" />
            <span className="font-semibold text-gray-900">
              Decision Sprint
            </span>
            <span className="text-primary text-sm font-medium hidden sm:inline">
              by Framework Friday
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="mailto:hello@frameworkfriday.ai"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Mail size={14} />
            Need Help?
          </a>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Sprint HQ</span>
            <span className="hidden sm:inline"> · {dateRange}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
