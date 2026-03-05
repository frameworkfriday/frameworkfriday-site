"use client";

import { Check } from "lucide-react";

const TIPS = [
  {
    title: "Be specific",
    description:
      "Vague answers get follow-up questions. Save time by being detailed upfront.",
  },
  {
    title: "Block focused time",
    description:
      "Don't squeeze this between meetings. Give yourself room to think.",
  },
  {
    title: "Save your work immediately",
    description:
      "Copy artifacts to a Google Doc as soon as you complete them.",
  },
  {
    title: "It's okay to estimate",
    description:
      "Reasonable estimates are valuable. Perfect precision isn't required.",
  },
  {
    title: "Don't over-polish",
    description:
      "Honest uncertainty is fine. We're looking for clarity, not perfection.",
  },
  {
    title: "Your expertise matters",
    description:
      "You know your workflows better than anyone. Trust that knowledge.",
  },
  {
    title: "Attend the live sessions",
    description:
      "The facilitated discussions add context your Companion can't provide.",
  },
  {
    title: "Ask questions early",
    description:
      "Don't wait until Day 4. Raise questions in live sessions or via email.",
  },
];

export function TipsForSuccess() {
  return (
    <section className="mt-16 mb-8">
      <h2 className="text-2xl font-bold text-center text-gray-900">
        Tips for Success
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 max-w-2xl mx-auto">
        {TIPS.map((tip) => (
          <div
            key={tip.title}
            className="bg-gray-50 rounded-xl p-4 flex items-start gap-3"
          >
            <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {tip.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {tip.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
