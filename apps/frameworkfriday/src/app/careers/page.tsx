import type { Metadata } from "next";
import { MapPin, Clock, Mail } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { openPositions } from "@/data/careers";

export const metadata: Metadata = {
  title: "Careers at Framework Friday",
  description:
    "Join the team building AI implementation education for operators. Remote-first, clear ownership, practical tools.",
  openGraph: {
    title: "Careers at Framework Friday",
    description: "Join the team building AI implementation education for operators.",
  },
};

export default function Careers() {
  return (
    <>
      {/* JobPosting JSON-LD for each position */}
      {openPositions.map((position) => (
        <JsonLd
          key={position.title}
          data={{
            "@context": "https://schema.org",
            "@type": "JobPosting",
            title: position.title,
            description: position.description,
            employmentType: position.type === "Full-time" ? "FULL_TIME" : "PART_TIME",
            jobLocationType: "TELECOMMUTE",
            hiringOrganization: {
              "@type": "Organization",
              name: "Framework Friday",
              sameAs: "https://frameworkfriday.ai",
            },
          }}
        />
      ))}

      {/* Hero */}
      <section className="py-12 sm:py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">Careers</h1>
          <p className="mt-5 sm:mt-6 text-gray-500 text-base sm:text-lg leading-relaxed">
            We&apos;re building AI implementation education for operators. If you value clear ownership,
            speed, and practical tools over theory — we want to hear from you.
          </p>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-10">Open Positions</h2>
          <div className="space-y-4 sm:space-y-6">
            {openPositions.map((position) => (
              <div key={position.title} className="card-hover bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold">{position.title}</h3>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {position.type}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} /> {position.location}
                  </span>
                </div>
                <p className="text-gray-500 mt-4 leading-relaxed text-sm sm:text-base">{position.description}</p>
                <a
                  href={`mailto:hello@frameworkfriday.ai?subject=Application: ${position.title}`}
                  className="mt-5 inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm sm:text-base"
                >
                  <Mail size={16} /> Apply via Email
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture */}
      <section className="py-12 sm:py-20 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="section-divider mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-6">How We Work</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-left mt-8">
            {[
              { title: "Remote-First", description: "Work from anywhere. We care about output, not office hours." },
              { title: "Clear Ownership", description: "Every person owns their domain. No committees, no death by consensus." },
              { title: "Ship Fast", description: "We bias toward action. Build it, test it, iterate." },
              { title: "Practical Tools", description: "We use what works. No tool religion, no unnecessary complexity." },
            ].map((item) => (
              <div key={item.title} className="border border-gray-200 rounded-2xl p-6">
                <h3 className="font-bold text-base sm:text-lg">{item.title}</h3>
                <p className="text-gray-500 mt-2 text-sm sm:text-base leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
