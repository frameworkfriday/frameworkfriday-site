import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Media — Podcast & Press",
  description:
    "Real conversations about AI implementation with operators. Listen to the Framework Friday podcast and explore press resources.",
  openGraph: {
    title: "Media — Podcast & Press",
    description: "Real conversations about AI implementation with operators.",
  },
};

export default function Media() {
  return (
    <>
      {/* Hero */}
      <section className="py-12 sm:py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">Media</h1>
          <p className="mt-5 sm:mt-6 text-gray-500 text-base sm:text-lg leading-relaxed">
            Real conversations about AI implementation with operators who are building, not theorizing.
          </p>
        </div>
      </section>

      {/* Podcast */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-4xl mx-auto">
          <div className="section-divider mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-6">Podcast</h2>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8">
            Hear from operators navigating AI implementation in real businesses. No hype, no fluff — just what&apos;s working and what&apos;s not.
          </p>
          <a
            href="https://www.youtube.com/@frameworkfriday"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-gray-950 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Watch on YouTube
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Press */}
      <section className="py-12 sm:py-20 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="section-divider mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-6">Press & Appearances</h2>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
            Press appearances and speaking engagements coming soon.
          </p>
        </div>
      </section>

      {/* Press Kit */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-4xl mx-auto">
          <div className="section-divider mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-6">Press Kit</h2>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
            For press inquiries, reach out to{" "}
            <a href="mailto:hello@frameworkfriday.ai" className="text-primary hover:underline">
              hello@frameworkfriday.ai
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
