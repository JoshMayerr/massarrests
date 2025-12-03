export default function StatsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="transit-card text-center border-l-4 border-l-red-500">
          <div className="h-16 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
        <div className="transit-card text-center border-l-4 border-l-orange-500">
          <div className="h-16 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
        <div className="transit-card text-center border-l-4 border-l-green-500">
          <div className="h-16 bg-gray-200 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Timeline Chart Skeleton */}
        <div className="transit-card border-l-4 border-l-blue-500">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-[200px] bg-gray-100 rounded border border-dashed border-gray-300"></div>
        </div>

        {/* Top Charges Skeleton */}
        <div className="transit-card border-l-4 border-l-green-500">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-[200px] bg-gray-100 rounded border border-dashed border-gray-300"></div>
        </div>
      </div>

      {/* Additional Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Age Distribution Skeleton */}
        <div className="transit-card border-l-4 border-l-teal-500">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="h-[200px] bg-gray-100 rounded border border-dashed border-gray-300"></div>
        </div>

        {/* Sex Breakdown Skeleton */}
        <div className="transit-card border-l-4 border-l-pink-500">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-[200px] bg-gray-100 rounded border border-dashed border-gray-300"></div>
        </div>

        {/* Race Breakdown Skeleton */}
        <div className="transit-card border-l-4 border-l-indigo-500">
          <div className="h-6 bg-gray-200 rounded w-28 mb-4"></div>
          <div className="h-[200px] bg-gray-100 rounded border border-dashed border-gray-300"></div>
        </div>
      </div>
    </div>
  );
}
