export default function SprintPageLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header skeleton */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>

      {/* Nav skeleton */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2.5 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="h-8 w-28 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Section title */}
        <div className="h-7 w-56 bg-gray-200 rounded-lg animate-pulse" />

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-xl p-6 space-y-3"
            >
              <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Accordion skeleton */}
        <div className="space-y-3 mt-8">
          <div className="h-7 w-44 bg-gray-200 rounded-lg animate-pulse" />
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="bg-gray-50 rounded-xl h-16 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
