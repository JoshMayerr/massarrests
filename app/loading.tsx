import SidebarSkeleton from "@/components/skeletons/SidebarSkeleton";
import StatsSkeleton from "@/components/skeletons/StatsSkeleton";
import HeatmapSkeleton from "@/components/skeletons/HeatmapSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar Skeleton - Fixed position, full height, hidden on mobile */}
      <div className="fixed left-0 top-0 w-80 h-screen hidden lg:block z-10">
        <SidebarSkeleton />
      </div>

      {/* Main Content Area with Header */}
      <div className="lg:ml-80 min-h-screen flex flex-col">
        {/* Header */}
        <div className="border-b-2 bg-white">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="h-8 bg-gray-200 rounded w-32 mr-4 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="flex-1 p-4 lg:p-6 space-y-6 lg:space-y-8">
          <HeatmapSkeleton />
          <StatsSkeleton />
        </div>
      </div>
    </div>
  );
}
