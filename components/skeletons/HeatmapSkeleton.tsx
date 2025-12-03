export default function HeatmapSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
      <div className="h-[500px] w-full border-2 border-gray-300 rounded bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="transit-data text-gray-500 mb-2">Loading map...</div>
          <div className="w-16 h-16 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
