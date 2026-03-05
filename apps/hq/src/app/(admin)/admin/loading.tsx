export default function AdminLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="w-9 h-9 bg-gray-100 rounded-lg animate-pulse mb-3" />
            <div className="h-7 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-100 rounded mt-1 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
