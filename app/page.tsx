import Layout from "@/components/Layout";
import StatsCharts from "@/components/StatsCharts";
import ArrestHeatmapWrapper from "@/components/ArrestHeatmapWrapper";
import { getAppData } from "@/lib/dataService";

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

  const { arrests, stats, incidentBreakdown, topCities, timelineData } =
    await getAppData(filters);

  return (
    <Layout arrests={arrests} filters={filters}>
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
