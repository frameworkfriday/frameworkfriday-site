import { ArrowRight } from "lucide-react";
import { teamMembers } from "../data/team";
import aboutWorkshop from "../assets/images/about-workshop.jpg";
import aboutLucasCandid from "../assets/images/about-lucas-candid.jpg";
import aboutRooftop from "../assets/images/about-rooftop.png";

const headshots: Record<string, string> = import.meta.glob(
  "../assets/images/*-headshot.*",
  { eager: true, query: "?url", import: "default" }
) as Record<string, string>;

function getHeadshot(filename: string): string {
  const match = Object.entries(headshots).find(([path]) => path.includes(filename));
  return match ? match[1] : "";
}

const START_URL = "https://start.frameworkfriday.ai";

export default function About() {
  return (
    <>
      {/* Hero */}
      <section className="py-12 sm:py-20 md:py-28 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              We built it first. Then we decided to share it.
            </h1>
            <p className="mt-5 sm:mt-6 text-gray-500 text-base sm:text-lg leading-relaxed">
              Framework Friday exists because we got tired of seeing businesses buy into AI hype
              without a plan. We're operators who built systems that work — and now we teach others to
              do the same.
            </p>
          </div>
          <div>
            <img
              src={aboutWorkshop}
              alt="Framework Friday workshop"
              className="rounded-2xl w-full shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div>
            <img
              src={aboutLucasCandid}
              alt="Lucas Robinson"
              className="rounded-2xl w-full shadow-lg"
            />
          </div>
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Our Story
            </span>
            <div className="space-y-4 mt-4 text-gray-500 text-base sm:text-lg leading-relaxed">
              <p>
                Framework Friday started inside a portfolio of companies generating over $275M in annual
                revenue. When AI tools began reshaping every industry, we didn't hire consultants — we
                rolled up our sleeves and built implementation systems from the inside.
              </p>
              <p>
                What we found was that most AI education missed the mark. It focused on tools and
                prompts instead of the hard questions: Which workflows should we automate? How do we
                measure ROI? How do we get teams to actually adopt this?
              </p>
              <p>
                So we built our own framework. Tested it. Refined it. And once it was proven across
                multiple industries and team sizes, we decided to make it available to every
                growth-minded business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-12 sm:py-20 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="section-divider mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Real operators. Real workflows. Real results.
          </h2>
        </div>
      </section>

      {/* Team */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-10 sm:mb-14">The Team</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
            {teamMembers.map((member) => (
              <div key={member.name} className="text-center">
                <img
                  src={getHeadshot(member.image)}
                  alt={member.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover mx-auto mb-3 sm:mb-4 shadow-md ring-4 ring-white"
                />
                <h3 className="font-bold text-base sm:text-lg">{member.name}</h3>
                <p className="text-xs sm:text-sm text-primary font-medium mt-1">{member.role}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Photo */}
      <section className="py-12 sm:py-20 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img
            src={aboutRooftop}
            alt="Community gathering"
            className="rounded-2xl w-full mb-6 sm:mb-8 shadow-lg"
          />
          <p className="text-lg sm:text-xl font-semibold text-gray-500">
            Building relationships beyond the boardroom.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section-gradient py-12 sm:py-20 md:py-24 px-4 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">See it in action.</h2>
          <p className="mt-3 sm:mt-4 text-gray-400 text-base sm:text-lg">
            The Decision Sprint is where we start every engagement. Find out if it's right for your
            business.
          </p>
          <a
            href={START_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 sm:mt-8 inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 sm:py-4 rounded-lg hover:bg-primary-hover transition-all shadow-lg w-full sm:w-auto"
          >
            Start Decision Sprint
            <ArrowRight size={18} />
          </a>
        </div>
      </section>
    </>
  );
}
