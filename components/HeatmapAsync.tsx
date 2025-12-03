import { Suspense } from "react";
import ArrestHeatmapWrapper from "./ArrestHeatmapWrapper";
import HeatmapSkeleton from "./skeletons/HeatmapSkeleton";
import { fetchHeatmapData } from "@/lib/dataService";
import { Filters } from "@/lib/dataService";

interface HeatmapAsyncProps {
  filters: Filters;
}

async function HeatmapData({ filters }: HeatmapAsyncProps) {
  const cityCounts = await fetchHeatmapData(filters);
  return <ArrestHeatmapWrapper cityCounts={cityCounts} />;
}

export default function HeatmapAsync({ filters }: HeatmapAsyncProps) {
  return (
    <Suspense fallback={<HeatmapSkeleton />}>
      <HeatmapData filters={filters} />
    </Suspense>
  );
}
