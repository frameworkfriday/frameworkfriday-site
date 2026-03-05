"use client";

import { Video, BookOpen, Clock, Lightbulb } from "lucide-react";

export function TimeCommitment() {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-center text-gray-900">
        Time Commitment
      </h2>

      <div className="grid grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto">
        <div className="border border-gray-200 rounded-xl p-5 text-center">
          <Video size={24} className="mx-auto text-gray-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">~4 hrs</p>
          <p className="text-sm text-gray-600 mt-1">Live Sessions</p>
          <p className="text-xs text-gray-400 mt-1">
            3x 60 min sessions + 1x 1:1 call (45-60 min)
          </p>
        </div>
        <div className="border border-gray-200 rounded-xl p-5 text-center">
          <BookOpen size={24} className="mx-auto text-gray-500 mb-2" />
          <p className="text-2xl font-bold text-gray-900">1-2 hrs</p>
          <p className="text-sm text-gray-600 mt-1">Work Sessions</p>
          <p className="text-xs text-gray-400 mt-1">
            Per session x 3 (with AI Companion)
          </p>
        </div>
        <div className="border border-primary/20 bg-primary-light/30 rounded-xl p-5 text-center">
          <Clock size={24} className="mx-auto text-primary mb-2" />
          <p className="text-2xl font-bold text-primary">7-10 hrs</p>
          <p className="text-sm text-gray-600 mt-1">Total</p>
          <p className="text-xs text-gray-400 mt-1">Across the week</p>
        </div>
      </div>

      <div className="mt-4 max-w-2xl mx-auto bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-sm text-gray-600">
          <Lightbulb size={14} className="inline mr-1 text-yellow-500" />
          <strong>Pro tip:</strong> Block 2-3 hours for each of Days 1-3
          (session + work). Day 4 is outcome day—no extra work.
        </p>
      </div>
    </section>
  );
}
