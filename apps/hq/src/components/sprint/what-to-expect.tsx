"use client";

import { Check, X } from "lucide-react";

export function WhatToExpect() {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold text-center text-gray-900">
        What to Expect
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-3xl mx-auto">
        {/* What This IS */}
        <div className="border border-green-200 rounded-xl p-5">
          <h3 className="font-semibold text-success flex items-center gap-1.5">
            <Check size={16} />
            What This IS
          </h3>
          <ul className="mt-3 space-y-2.5 text-sm text-gray-600">
            {[
              "4-day diagnostic sprint",
              "Work with AI Companion on real workflows",
              "Produce implementation-ready artifacts",
              "Receive clear Go or Not Yet outcome",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* What This is NOT */}
        <div className="border border-red-200 rounded-xl p-5">
          <h3 className="font-semibold text-danger flex items-center gap-1.5">
            <X size={16} />
            What This is NOT
          </h3>
          <ul className="mt-3 space-y-2.5 text-sm text-gray-600">
            {[
              "A course to watch",
              "Video tutorials to consume",
              "Certification to collect",
              "Something that sits in a folder",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <X size={14} className="text-danger mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Your Outcome */}
        <div className="border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900">Your Outcome</h3>
          <p className="text-sm text-gray-500 mt-1">
            On Day 4, you&apos;ll receive either:
          </p>
          <div className="mt-3 space-y-2">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-success">Go</p>
              <p className="text-xs text-gray-600">Ready to proceed</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-warning">Not Yet</p>
              <p className="text-xs text-gray-600">More groundwork needed</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 italic mt-2">
            Both outcomes are valuable—you&apos;ll have clarity either way.
          </p>
        </div>
      </div>
    </section>
  );
}
