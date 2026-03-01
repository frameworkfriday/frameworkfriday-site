import { teamMembers } from "../data/team";
import aboutWorkshop from "../assets/images/about-workshop.jpg";
import aboutLucasCandid from "../assets/images/about-lucas-candid.jpg";
import aboutRooftop from "../assets/images/about-rooftop.png";

// Import headshots dynamically
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
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              We built it first. Then we decided to share it.
            </h1>
            <p className="mt-6 text-gray-600 text-lg leading-relaxed">
              Framework Friday exists because we got tired of seeing businesses buy into AI hype
              without a plan. We're operators who built systems that work — and now we teach others to
              do the same.
            </p>
          </div>
          <div>
            <img
              src={aboutWorkshop}
              alt="Framework Friday workshop"
              className="rounded-xl w-full"
            />
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <img
              src={aboutLucasCandid}
              alt="Lucas Robinson"
              className="rounded-xl w-full"
            />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Our Story
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              Framework Friday started inside a portfolio of companies generating over $275M in annual
              revenue. When AI tools began reshaping every industry, we didn't hire consultants — we
              rolled up our sleeves and built implementation systems from the inside.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mt-4">
              What we found was that most AI education missed the mark. It focused on tools and
              prompts instead of the hard questions: Which workflows should we automate? How do we
              measure ROI? How do we get teams to actually adopt this?
            </p>
            <p className="text-gray-600 text-lg leading-relaxed mt-4">
              So we built our own framework. Tested it. Refined it. And once it was proven across
              multiple industries and team sizes, we decided to make it available to every
              growth-minded business.
            </p>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Real operators. Real workflows. Real results.
          </h2>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">The Team</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {teamMembers.map((member) => (
              <div key={member.name} className="text-center">
                <img
                  src={getHeadshot(member.image)}
                  alt={member.name}
                  className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                />
                <h3 className="font-bold text-lg">{member.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{member.role}</p>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Photo */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <img
            src={aboutRooftop}
            alt="Community gathering"
            className="rounded-xl w-full mb-6"
          />
          <p className="text-xl font-semibold text-gray-600">
            Building relationships beyond the boardroom.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold">See it in action.</h2>
          <p className="mt-4 text-gray-400 text-lg">
            The Decision Sprint is where we start every engagement. Find out if it's right for your
            business.
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
