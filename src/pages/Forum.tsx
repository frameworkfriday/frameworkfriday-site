import iconForum from "../assets/images/icon-forum.png";

const START_URL = "https://start.frameworkfriday.ai";

const features = [
  {
    title: "Peer Groups",
    description: "Small cohorts of 8–12 operators at similar stages, meeting regularly.",
  },
  {
    title: "Implementation Support",
    description: "Get unstuck with input from people who've solved similar problems.",
  },
  {
    title: "Structured Cadence",
    description: "Two 90-minute sessions per month plus additional office hours to keep momentum.",
  },
  {
    title: "Accountability",
    description: "Share commitments, report progress, stay on track.",
  },
];

export default function Forum() {
  return (
    <>
      {/* Hero */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <img src={iconForum} alt="Operator Forum" className="h-16 w-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">Operator Forum</h1>
          <p className="mt-6 text-gray-600 text-lg leading-relaxed">
            The hardest part of AI implementation isn't the technology — it's maintaining momentum.
            The Forum keeps you moving.
          </p>
          <a
            href={START_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block bg-gray-950 text-white font-medium px-8 py-3.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Start with Decision Sprint
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white border border-gray-200 rounded-xl p-8"
            >
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="text-gray-600 mt-2">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How the Operator Forum Works</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            The Operator Forum is a structured peer community for operators actively deploying AI
            inside their businesses. It's not a Slack group. It's not a course. It's ongoing,
            facilitated accountability with people who understand what you're building.
          </p>
        </div>
      </section>

      {/* How to Join */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How to Join</h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Operator Forum access is available to Decision Sprint graduates. Complete the Sprint, and
            you'll be invited to join a cohort of peers at your level.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to stay accountable?</h2>
          <p className="mt-4 text-gray-400 text-lg">
            Complete the Sprint, then join an Operator Forum cohort at your level.
          </p>
          <a
            href={START_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block bg-white text-gray-950 font-medium px-8 py-3.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Start with Decision Sprint
          </a>
        </div>
      </section>
    </>
  );
}
