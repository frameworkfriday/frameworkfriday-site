import { Link } from "react-router-dom";
import iconBuild from "../assets/images/icon-build.png";
import iconValidate from "../assets/images/icon-validate.png";
import iconTeach from "../assets/images/icon-teach.png";
import iconDecisionSprint from "../assets/images/icon-decision-sprint.png";
import iconAcademy from "../assets/images/icon-academy.png";
import iconForum from "../assets/images/icon-forum.png";
import lucasHeadshot from "../assets/images/lucas-headshot.jpeg";

const START_URL = "https://start.frameworkfriday.ai";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 md:py-28 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            AI implementation education from operators, not influencers.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Learn from operators who've built AI workflows across a $275M+ portfolio of real
            businesses. No theory. No hype. Just what's working.
          </p>
          <a
            href={START_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block bg-gray-950 text-white font-medium px-8 py-3.5 rounded-lg hover:bg-gray-800 transition-colors text-base"
          >
            Start with Decision Sprint
          </a>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            Most AI education is built by people who've never run a business.
          </h2>
          <p className="mt-6 text-gray-600 text-lg leading-relaxed">
            They teach tools, not transformation. Prompts, not process. The result? Teams that can
            demo AI but can't deploy it where it matters — inside real workflows, with real
            constraints, under real deadlines. We productized what worked inside our own portfolio and
            made it available to every operator ready to build.
          </p>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Built Inside Real Businesses</h2>
            <p className="mt-4 text-gray-600 text-lg max-w-2xl mx-auto">
              Everything we teach comes from operating a portfolio of companies. Not theory. Not
              trends. Frameworks born from real implementation.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: iconBuild,
                step: "01",
                title: "We build it",
                description: "Inside our own portfolio companies first.",
              },
              {
                icon: iconValidate,
                step: "02",
                title: "We validate it",
                description: "Across real teams, real workflows, real constraints.",
              },
              {
                icon: iconTeach,
                step: "03",
                title: "We teach it",
                description: "Only after it's proven do we share the playbook.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="border border-gray-200 rounded-xl p-8 text-center hover:shadow-md transition-shadow"
              >
                <img src={item.icon} alt={item.title} className="h-16 w-16 mx-auto mb-4" />
                <span className="text-sm font-semibold text-gray-400">{item.step}</span>
                <h3 className="text-xl font-bold mt-2">{item.title}</h3>
                <p className="text-gray-600 mt-2">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offerings */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Where to Start</h2>
            <p className="mt-4 text-gray-600 text-lg">
              Three paths. One goal: real AI implementation.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Decision Sprint */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <img src={iconDecisionSprint} alt="Decision Sprint" className="h-12 w-12" />
                <span className="text-xs font-semibold bg-gray-950 text-white px-2.5 py-1 rounded-full">
                  Start Here
                </span>
              </div>
              <h3 className="text-xl font-bold">Decision Sprint</h3>
              <p className="text-sm text-gray-500 mt-1">4-Day Diagnostic for Operators</p>
              <p className="text-gray-600 mt-4 flex-1">
                Know exactly which workflow to automate first — and whether your team is ready.
                You'll produce a workflow inventory, automation map, and implementation spec.
              </p>
              <a
                href={START_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 block text-center bg-gray-950 text-white font-medium px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Start Decision Sprint
              </a>
            </div>

            {/* Academy */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col">
              <img src={iconAcademy} alt="Academy" className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold">The Academy</h3>
              <p className="text-sm text-gray-500 mt-1">5-Session Program</p>
              <p className="text-gray-600 mt-4 flex-1">
                Free foundational resources. Five self-paced lessons that prepare you for AI
                implementation. Each lesson produces an artifact.
              </p>
              <Link
                to="/academy"
                className="mt-6 block text-center border border-gray-300 text-gray-950 font-medium px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Explore Academy
              </Link>
            </div>

            {/* Forum */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 flex flex-col">
              <img src={iconForum} alt="Operator Forum" className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-bold">Operator Forum</h3>
              <p className="text-sm text-gray-500 mt-1">Ongoing Peer Accountability</p>
              <p className="text-gray-600 mt-4 flex-1">
                For Decision Sprint graduates: ongoing peer accountability for operators actively
                building AI workflows.
              </p>
              <Link
                to="/forum"
                className="mt-6 block text-center border border-gray-300 text-gray-950 font-medium px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Learn About Forum
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src={lucasHeadshot}
                alt="Lucas Robinson"
                className="rounded-xl w-full max-w-md mx-auto"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Led by Practitioners</h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                <strong className="text-gray-950">Lucas Robinson</strong> is the CEO of Framework
                Friday and an operator across a portfolio of companies generating $275M+ in revenue.
                He doesn't teach AI theory — he deploys it inside real businesses every day.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mt-4">
                Lucas also serves as AI Chair for Entrepreneurs' Organization — to our knowledge, the
                first dedicated AI Chair in EO.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed mt-4">
                Everything in the Decision Sprint, Academy, and Forum comes from what's actually
                working inside the portfolio — not what's trending on social media.
              </p>
              <Link
                to="/about"
                className="mt-6 inline-block text-gray-950 font-medium hover:underline"
              >
                Meet the team →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to find out which workflow to automate first?
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            The Decision Sprint gives you a clear, prioritized implementation plan in 2 weeks.
          </p>
          <a
            href={START_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block bg-white text-gray-950 font-medium px-8 py-3.5 rounded-lg hover:bg-gray-100 transition-colors text-base"
          >
            Start Decision Sprint
          </a>
        </div>
      </section>
    </>
  );
}
