import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import ProductLogo from "@/components/ui/ProductLogo";

export const metadata: Metadata = {
  title: "Operator Forum — Peer Accountability for AI Implementation",
  description:
    "Structured peer community for operators actively deploying AI inside their businesses. Small cohorts, facilitated accountability.",
  openGraph: {
    title: "Operator Forum — Peer Accountability for AI Implementation",
    description: "Structured peer community for operators actively deploying AI.",
  },
};

const START_URL = "https://start.frameworkfriday.ai";

const features = [
  { title: "Peer Groups", description: "Small cohorts of 8\u201312 operators at similar stages, meeting regularly." },
  { title: "Implementation Support", description: "Get unstuck with input from people who've solved similar problems." },
  { title: "Structured Cadence", description: "Two 90-minute sessions per month plus additional office hours to keep momentum." },
  { title: "Accountability", description: "Share commitments, report progress, stay on track." },
];

export default function Forum() {
  return (
    <>
      {/* Hero */}
      <section className="py-12 sm:py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <ProductLogo product="forum" size="lg" className="mx-auto mb-5 sm:mb-6" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">Operator Forum</h1>
          <p className="mt-5 sm:mt-6 text-gray-500 text-base sm:text-lg leading-relaxed">
            The hardest part of AI implementation isn&apos;t the technology — it&apos;s maintaining momentum.
            The Forum keeps you moving.
          </p>
          <a href={START_URL} target="_blank" rel="noopener noreferrer" className="mt-6 sm:mt-8 inline-flex items-center justify-center gap-2 bg-gray-950 text-white font-semibold px-8 py-3.5 sm:py-4 rounded-lg hover:bg-gray-800 transition-all shadow-md w-full sm:w-auto">
            Start with Decision Sprint <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-6 sm:gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="card-hover bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <h3 className="text-base sm:text-lg font-bold">{feature.title}</h3>
              <p className="text-gray-500 mt-2 leading-relaxed text-sm sm:text-base">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-20 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="section-divider mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-6">How the Operator Forum Works</h2>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
            The Operator Forum is a structured peer community for operators actively deploying AI
            inside their businesses. It&apos;s not a Slack group. It&apos;s not a course. It&apos;s ongoing,
            facilitated accountability with people who understand what you&apos;re building.
          </p>
        </div>
      </section>

      {/* How to Join */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-6">How to Join</h2>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed">
            Operator Forum access is available to Decision Sprint graduates. Complete the Sprint, and
            you&apos;ll be invited to join a cohort of peers at your level.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section-gradient py-12 sm:py-20 md:py-24 px-4 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Ready to stay accountable?</h2>
          <p className="mt-3 sm:mt-4 text-gray-400 text-base sm:text-lg">
            Complete the Sprint, then join an Operator Forum cohort at your level.
          </p>
          <a href={START_URL} target="_blank" rel="noopener noreferrer" className="mt-6 sm:mt-8 inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 sm:py-4 rounded-lg hover:bg-primary-hover transition-all shadow-lg w-full sm:w-auto">
            Start with Decision Sprint <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </>
  );
}
