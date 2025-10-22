import Layout from "@/components/Layout";
import StatsCharts from "@/components/StatsCharts";
import ArrestHeatmapWrapper from "@/components/ArrestHeatmapWrapper";
import { getAppData } from "@/lib/dataService";

export default async function Home() {
  const { arrests, stats, incidentBreakdown, topCities, timelineData } =
    await getAppData();

  return (
    <Layout arrests={arrests}>
      {/* Heatmap */}
      <ArrestHeatmapWrapper arrests={arrests} />

      {/* Charts and Stats */}
      <StatsCharts
        stats={stats}
        incidentBreakdown={incidentBreakdown}
        topCities={topCities}
        timelineData={timelineData}
      />
    </Layout>
  );
}
