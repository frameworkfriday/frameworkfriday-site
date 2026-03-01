import iconAcademy from "../assets/images/icon-academy.png";

const START_URL = "https://start.frameworkfriday.ai";

const sessions = [
  {
    number: 1,
    title: "AI Landscape & Strategy",
    description: "Understand where AI fits in your business — not someone else's.",
  },
  {
    number: 2,
    title: "Workflow Mapping",
    description: "Identify every process that could benefit from automation.",
  },
  {
    number: 3,
    title: "ROI Framework",
    description: "Build a business case that gets buy-in from stakeholders.",
  },
  {
    number: 4,
    title: "Tool Selection",
    description: "Choose the right tools without getting locked into the wrong stack.",
  },
  {
    number: 5,
    title: "Implementation Planning",
    description: "Create a 90-day action plan your team can execute.",
  },
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
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <img src={iconAcademy} alt="Academy" className="h-16 w-16 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">The Academy</h1>
          <p className="mt-6 text-gray-600 text-lg leading-relaxed">
            Five structured sessions that give your team the frameworks, vocabulary, and strategic
            clarity needed before any AI tool gets deployed.
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

      {/* Format / Focus / Outcome */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="border border-gray-200 bg-white rounded-xl p-8 text-center">
            <h3 className="text-lg font-bold mb-3">Format</h3>
            <p className="text-gray-600">
              5 live sessions with guided exercises and real-world application
            </p>
          </div>
          <div className="border border-gray-200 bg-white rounded-xl p-8 text-center">
            <h3 className="text-lg font-bold mb-3">Focus</h3>
            <p className="text-gray-600">
              Strategy, workflow mapping, ROI, tool selection, and implementation planning
            </p>
          </div>
          <div className="border border-gray-200 bg-white rounded-xl p-8 text-center">
            <h3 className="text-lg font-bold mb-3">Outcome</h3>
            <p className="text-gray-600">
              A team aligned on AI strategy with a clear 90-day action plan
            </p>
          </div>
        </div>
      </section>

      {/* Sessions */}
      <section className="py-16 md:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What You'll Learn</h2>
          <div className="space-y-6">
            {sessions.map((session) => (
              <div
                key={session.number}
                className="flex gap-6 items-start border border-gray-200 rounded-xl p-6"
              >
                <span className="flex-shrink-0 w-10 h-10 bg-gray-950 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {session.number}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{session.title}</h3>
                  <p className="text-gray-600 mt-1">{session.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="py-16 md:py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">Who This Is For</h2>
          <ul className="space-y-4">
            {audience.map((item) => (
              <li key={item} className="flex items-start gap-3 text-gray-600 text-lg">
                <span className="flex-shrink-0 mt-1.5 w-2 h-2 bg-gray-950 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 px-4 bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to prepare your team?</h2>
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
