import type { Metadata } from "next";
import { ArrowRight, CheckCircle } from "lucide-react";
import ProductLogo from "@/components/ui/ProductLogo";

export const metadata: Metadata = {
  title: "The Academy — 5-Session AI Implementation Program",
  description:
    "Five structured sessions that give your team the frameworks, vocabulary, and strategic clarity needed before any AI tool gets deployed.",
  openGraph: {
    title: "The Academy — 5-Session AI Implementation Program",
    description:
      "Five structured sessions that give your team the frameworks needed before any AI tool gets deployed.",
  },
};

const ACADEMY_URL = "https://start.frameworkfriday.ai/academy-home";

const sessions = [
  { number: 1, title: "AI Landscape & Strategy", description: "Understand where AI fits in your business — not someone else's." },
  { number: 2, title: "Workflow Mapping", description: "Identify every process that could benefit from automation." },
  { number: 3, title: "ROI Framework", description: "Build a business case that gets buy-in from stakeholders." },
  { number: 4, title: "Tool Selection", description: "Choose the right tools without getting locked into the wrong stack." },
  { number: 5, title: "Implementation Planning", description: "Create a 90-day action plan your team can execute." },
];

const audience = [
  "Business operators wanting AI understanding before investment",
  "Teams preparing their first AI implementation",
  "Leaders needing common frameworks before vendor engagement",
];

export default function Academy() {
  return (
    <>
      {/* Hero */}
      <section className="py-12 sm:py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <ProductLogo product="academy" size="lg" className="mx-auto mb-5 sm:mb-6" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">The Academy</h1>
          <p className="mt-5 sm:mt-6 text-gray-500 text-base sm:text-lg leading-relaxed">
            Five structured sessions that give your team the frameworks, vocabulary, and strategic
            clarity needed before any AI tool gets deployed.
          </p>
          <a href={ACADEMY_URL} target="_blank" rel="noopener noreferrer" className="mt-6 sm:mt-8 inline-flex items-center justify-center gap-2 bg-gray-950 text-white font-semibold px-8 py-3.5 sm:py-4 rounded-lg hover:bg-gray-800 transition-all shadow-md w-full sm:w-auto">
            Explore the Academy <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Format / Focus / Outcome */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 sm:gap-8">
          {[
            { title: "Format", description: "5 live sessions with guided exercises and real-world application" },
            { title: "Focus", description: "Strategy, workflow mapping, ROI, tool selection, and implementation planning" },
            { title: "Outcome", description: "A team aligned on AI strategy with a clear 90-day action plan" },
          ].map((item) => (
            <div key={item.title} className="card-hover border border-gray-200 bg-white rounded-2xl p-6 sm:p-8 text-center">
              <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm sm:text-base">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sessions */}
      <section className="py-12 sm:py-20 md:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="section-divider mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">What You&apos;ll Learn</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {sessions.map((session) => (
              <div key={session.number} className="card-hover flex gap-4 sm:gap-5 items-start border border-gray-200 rounded-2xl p-5 sm:p-6 bg-white">
                <span className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold text-sm">{session.number}</span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">{session.title}</h3>
                  <p className="text-gray-500 mt-1 text-sm sm:text-base">{session.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10">Who This Is For</h2>
          <ul className="space-y-3 sm:space-y-4">
            {audience.map((item) => (
              <li key={item} className="flex items-start gap-3 text-gray-500 text-base sm:text-lg">
                <CheckCircle size={22} className="flex-shrink-0 mt-0.5 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section-gradient py-12 sm:py-20 md:py-24 px-4 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Ready to prepare your team?</h2>
          <a href={ACADEMY_URL} target="_blank" rel="noopener noreferrer" className="mt-6 sm:mt-8 inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 sm:py-4 rounded-lg hover:bg-primary-hover transition-all shadow-lg w-full sm:w-auto">
            Explore the Academy <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </>
  );
}
