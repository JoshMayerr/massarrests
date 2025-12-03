"use client";

import dynamic from "next/dynamic";
import HeatmapSkeleton from "./skeletons/HeatmapSkeleton";

interface ArrestHeatmapWrapperProps {
  cityCounts: Array<{ city: string; count: number }>;
}

// Dynamic import for ArrestHeatmap to ensure client-side rendering
const ArrestHeatmap = dynamic(
  () =>
    import("@/components/ArrestHeatmap").then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => <HeatmapSkeleton />,
  }
);

export default function ArrestHeatmapWrapper({
  cityCounts,
}: ArrestHeatmapWrapperProps) {
  return <ArrestHeatmap cityCounts={cityCounts} />;
}
