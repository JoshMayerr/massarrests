import Layout from "@/components/Layout";
import HeatmapAsync from "@/components/HeatmapAsync";
import StatsChartsAsync from "@/components/StatsChartsAsync";
import { fetchArrests } from "@/lib/dataService";

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

  // Only fetch arrests data initially for the sidebar
  // This allows the page to render immediately with the sidebar
  // Heatmap and stats will load progressively via Suspense
  const { arrests, total } = await fetchArrests(filters);

  // Calculate total pages for sidebar (25 items per page)
  const limit = 25;
  const totalPages = Math.ceil(total / limit);

  return (
    <Layout
      arrests={arrests}
      total={total}
      totalPages={totalPages}
      filters={filters}
    >
      {/* Heatmap - loads progressively with Suspense */}
      <HeatmapAsync filters={filters} />

      {/* Charts and Stats - loads progressively with Suspense */}
      <StatsChartsAsync filters={filters} />
    </Layout>
  );
}
