import Layout from "@/components/Layout";
import StatsCharts from "@/components/StatsCharts";
import ArrestHeatmapWrapper from "@/components/ArrestHeatmapWrapper";
import { getAppData, fetchHeatmapData } from "@/lib/dataService";

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  // Extract filter params from URL
  const town = typeof params.town === "string" ? params.town : undefined;
  const dateFrom =
    typeof params.dateFrom === "string" ? params.dateFrom : undefined;
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : undefined;

  const filters = {
    town,
    dateFrom,
    dateTo,
  };

  const { arrests, stats, topCharges, topCities, timelineData } =
    await getAppData(filters);

  // Fetch heatmap data separately to get all arrests (not limited to 100)
  const cityCounts = await fetchHeatmapData(filters);

  return (
    <Layout arrests={arrests} filters={filters}>
      {/* Heatmap */}
      <ArrestHeatmapWrapper cityCounts={cityCounts} />

      {/* Charts and Stats */}
      <StatsCharts
        stats={stats}
        topCharges={topCharges}
        topCities={topCities}
        timelineData={timelineData}
      />
    </Layout>
  );
}
