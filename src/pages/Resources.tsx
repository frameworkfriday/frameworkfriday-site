import { resources } from "../data/resources";

export default function Resources() {
  return (
    <>
      {/* Hero */}
      <section className="py-12 sm:py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            Resources
          </h1>
          <p className="mt-5 sm:mt-6 text-gray-500 text-base sm:text-lg leading-relaxed">
            Free tools and frameworks to help you evaluate, plan, and execute AI implementation.
          </p>
        </div>
      </section>

      {/* Resource Cards */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {resources.map((resource) => (
            <div
              key={resource.title}
              className="card-hover bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col"
            >
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {resource.category}
              </span>
              <h3 className="text-base sm:text-lg font-bold mt-2">{resource.title}</h3>
              <p className="text-gray-500 mt-3 flex-1 leading-relaxed text-sm sm:text-base">{resource.description}</p>
              <span className="mt-5 sm:mt-6 inline-block text-sm font-medium text-gray-400">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
