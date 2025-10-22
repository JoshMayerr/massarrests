"use client";

import { ArrestLog } from "@/lib/mockData";
import dynamic from "next/dynamic";

interface ArrestHeatmapWrapperProps {
  arrests: ArrestLog[];
}

// Dynamic import for ArrestHeatmap to ensure client-side rendering
const ArrestHeatmap = dynamic(
  () =>
    import("@/components/ArrestHeatmap").then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="transit-card">
        <h3 className="transit-section mb-4">Geographic Distribution</h3>
        <div className="bg-gray-100 border border-dashed border-gray-300 h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="transit-data text-gray-500 mb-2">
              Loading map...
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

export default function ArrestHeatmapWrapper({
  arrests,
}: ArrestHeatmapWrapperProps) {
  return <ArrestHeatmap arrests={arrests} />;
}
