import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import ProductLogo from "@/components/ui/ProductLogo";
import lucasHeadshot from "@/assets/images/lucas-headshot.jpeg";

const START_URL = "https://start.frameworkfriday.ai";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 sm:py-24 md:py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-warm-50 to-white" />
        <div className="max-w-4xl mx-auto text-center relative">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.15] tracking-tight animate-fade-in-up">
            AI implementation
            <br className="hidden md:block" />{" "}
            education from{" "}
            <span className="text-highlight">operators,</span>
            <br />
            <span className="text-highlight">not influencers.</span>
          </h1>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed animate-fade-in-up-delay">
            Learn from operators who&apos;ve built AI workflows across a $275M+
            portfolio of real businesses. No theory. No hype. Just what&apos;s
            working.
          </p>
          <div className="mt-8 sm:mt-10 animate-fade-in-up-delay-2">
            <a
              href={START_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gray-950 text-white font-semibold px-7 sm:px-8 py-3.5 sm:py-4 rounded-lg hover:bg-gray-800 transition-all text-base shadow-md hover:shadow-lg w-full sm:w-auto"
            >
              Start with Decision Sprint
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Problem — dark section with orange accent */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-gray-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
            Most AI education is built by people who&apos;ve{" "}
            <span className="underline decoration-primary decoration-3 underline-offset-4">
              never run a business.
            </span>
          </h2>
          <p className="mt-6 sm:mt-8 text-gray-400 text-base sm:text-lg leading-relaxed">
            They teach tools, not transformation. Prompts, not process. The
            result? Teams that can demo AI but can&apos;t deploy it where it matters
            — inside real workflows, with real constraints, under real deadlines.
            We productized what worked inside our own portfolio and made it
            available to every operator ready to build.
          </p>
        </div>
      </section>

      {/* Process — "Built Inside Real Businesses" */}
      <section className="py-16 sm:py-24 md:py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <div className="section-divider mx-auto mb-5 sm:mb-6" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Built Inside Real Businesses
            </h2>
            <p className="mt-3 sm:mt-4 text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
              Everything we teach comes from operating a portfolio of companies.
              Not theory. Not trends. Frameworks born from real implementation.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 md:gap-16">
            {[
              { step: "01", title: "We build it", description: "Inside our own portfolio companies first." },
              { step: "02", title: "We validate it", description: "Across real teams, real workflows, real constraints." },
              { step: "03", title: "We teach it", description: "Only after it's proven do we share the playbook." },
            ].map((item) => (
              <div key={item.step} className="text-center md:text-left">
                <span className="block text-6xl md:text-7xl font-bold text-primary leading-none">{item.step}</span>
                <div className="w-10 h-0.5 bg-primary mt-5 mb-6 mx-auto md:mx-0" />
                <h3 className="text-xl md:text-2xl font-bold">{item.title}</h3>
                <p className="text-gray-500 mt-3 leading-relaxed text-base">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offerings — "Where to Start" */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <div className="section-divider mx-auto mb-5 sm:mb-6" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Where to Start</h2>
            <p className="mt-3 sm:mt-4 text-gray-500 text-base sm:text-lg">
              Three paths. One goal:{" "}
              <span className="underline decoration-primary/40 underline-offset-2">real AI implementation.</span>
            </p>
          </div>

          {/* Decision Sprint — featured card */}
          <div className="mt-8 sm:mt-12 bg-gray-950 text-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl">
            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
              <ProductLogo product="decision-sprint" size="md" />
              <span className="text-xs font-bold bg-primary text-white px-3 py-1 rounded-full uppercase tracking-wider">Start Here</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold">Decision Sprint</h3>
            <p className="text-sm text-gray-400 mt-1 uppercase tracking-wider font-medium">4-Day Diagnostic for Operators</p>
            <p className="text-gray-300 mt-3 sm:mt-4 max-w-xl leading-relaxed text-sm sm:text-base">
              Know exactly which workflow to automate first — and whether your team is ready. You&apos;ll produce a workflow inventory, automation map, and implementation spec.
            </p>
            <a href={START_URL} target="_blank" rel="noopener noreferrer" className="mt-5 sm:mt-6 inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors w-full sm:w-auto">
              Start Decision Sprint <ArrowRight size={16} />
            </a>
          </div>

          {/* Academy + Forum — side by side */}
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8">
            <div className="card-hover bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col">
              <ProductLogo product="academy" size="md" className="mb-4" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">5-Session Program</span>
              <h3 className="text-lg sm:text-xl font-bold mt-2">The Academy</h3>
              <p className="text-gray-500 mt-3 flex-1 leading-relaxed text-sm sm:text-base">
                Free foundational resources. Five self-paced lessons that prepare you for AI implementation. Each lesson produces an artifact.
              </p>
              <a href="https://start.frameworkfriday.ai/academy" target="_blank" rel="noopener noreferrer" className="mt-5 sm:mt-6 inline-flex items-center gap-1.5 text-gray-950 font-semibold hover:text-primary transition-colors">
                Explore Academy <ArrowRight size={16} />
              </a>
            </div>

            <div className="card-hover bg-primary text-white rounded-2xl p-6 sm:p-8 flex flex-col">
              <ProductLogo product="forum" size="md" className="mb-4" />
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Ongoing Peer Accountability</span>
              <h3 className="text-lg sm:text-xl font-bold mt-2">Operator Forum</h3>
              <p className="text-white/80 mt-3 flex-1 leading-relaxed text-sm sm:text-base">
                For Decision Sprint graduates: ongoing peer accountability for operators actively building AI workflows.
              </p>
              <a href="https://start.frameworkfriday.ai/forum" target="_blank" rel="noopener noreferrer" className="mt-5 sm:mt-6 inline-flex items-center gap-1.5 text-white font-semibold hover:underline">
                Learn About Forum <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-12 sm:py-20 md:py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <Image src={lucasHeadshot} alt="Lucas Robinson" className="rounded-2xl w-full max-w-sm sm:max-w-md mx-auto shadow-lg" priority />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-5 sm:mb-6">Led by Practitioners</h2>
              <div className="space-y-4 text-gray-500 text-base sm:text-lg leading-relaxed">
                <p><strong className="text-gray-950">Lucas Robinson</strong> is the CEO of Framework Friday and an operator across a portfolio of companies generating $275M+ in revenue. He doesn&apos;t teach AI theory — he deploys it inside real businesses every day.</p>
                <p>Lucas also serves as AI Chair for Entrepreneurs&apos; Organization — to our knowledge, the first dedicated AI Chair in EO.</p>
                <p>Everything in the Decision Sprint, Academy, and Forum comes from what&apos;s actually working inside the portfolio — not what&apos;s trending on social media.</p>
              </div>
              <Link href="/about" className="mt-6 sm:mt-8 inline-flex items-center gap-2 text-primary font-semibold hover:underline">
                Meet the team <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof markers */}
      <section className="py-10 sm:py-12 px-4 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
            {[
              { stat: "$275M+", label: "Portfolio Revenue" },
              { stat: "First", label: "AI Chair in EO" },
              { stat: "Real", label: "Operator-Led Frameworks" },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-950">{item.stat}</div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section-gradient py-12 sm:py-20 md:py-24 px-4 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Ready to find out which workflow to automate first?</h2>
          <p className="mt-3 sm:mt-4 text-gray-400 text-base sm:text-lg">The Decision Sprint gives you a clear, prioritized implementation plan in 2 weeks.</p>
          <a href={START_URL} target="_blank" rel="noopener noreferrer" className="mt-6 sm:mt-8 inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 sm:py-4 rounded-lg hover:bg-primary-hover transition-all text-base shadow-lg hover:shadow-xl w-full sm:w-auto">
            Start Decision Sprint <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </>
  );
}
