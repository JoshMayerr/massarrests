import { Suspense } from "react";
import StatsCharts from "./StatsCharts";
import StatsSkeleton from "./skeletons/StatsSkeleton";
import { fetchStats } from "@/lib/dataService";
import { Filters } from "@/lib/dataService";

interface StatsChartsAsyncProps {
  filters: Filters;
}

async function StatsChartsData({ filters }: StatsChartsAsyncProps) {
  const statsData = await fetchStats(filters);

  return (
    <StatsCharts
      stats={statsData.stats}
      topCharges={statsData.topCharges}
      timelineData={statsData.timelineData}
      ageDistribution={statsData.ageDistribution}
      sexBreakdown={statsData.sexBreakdown}
      raceBreakdown={statsData.raceBreakdown}
      chargeCategories={statsData.chargeCategories}
      chargeTrends={statsData.chargeTrends}
      chargesByAge={statsData.chargesByAge}
      chargesByRace={statsData.chargesByRace}
      chargesBySex={statsData.chargesBySex}
    />
  );
}

export default function StatsChartsAsync({ filters }: StatsChartsAsyncProps) {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <StatsChartsData filters={filters} />
    </Suspense>
  );
}
