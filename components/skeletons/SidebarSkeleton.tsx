export default function SidebarSkeleton() {
  return (
    <div className="h-full border-r-2 border-b-2 border-black flex flex-col animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white border-b-2 border-black flex-shrink-0 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-6 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 overflow-y-auto sidebar-scrollbar bg-white">
        <div className="divide-y-2 divide-gray-200">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="p-4 border-l-4 border-l-gray-200">
              {/* Name and date */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>

              {/* Location */}
              <div className="mb-3">
                <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-40"></div>
              </div>

              {/* Charges */}
              <div className="flex flex-wrap gap-1">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="bg-white border-t-2 border-black flex-shrink-0 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
          <div className="flex-1 h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
