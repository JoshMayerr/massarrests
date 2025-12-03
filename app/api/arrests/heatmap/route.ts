import { NextRequest, NextResponse } from "next/server";
import { getBigQueryClient } from "@/lib/bigquery";
import { unstable_cache } from "next/cache";

export const revalidate = 3600; // Cache for 1 hour

async function getHeatmapData(
  city: string | null,
  town: string | null,
  dateFrom: string | null,
  dateTo: string | null
) {
  // Initialize the authenticated BigQuery client
  const bq = await getBigQueryClient();

  // Build WHERE clause conditions
  const conditions: string[] = [];
  const params: any = {};

  // City/Town filter (support both 'city' and 'town' params for backward compatibility)
  // Use LIKE to match variations like "NATICK", "Natick", "NATICK, MA"
  const cityTownFilter = city || town;
  if (cityTownFilter) {
    conditions.push(`UPPER(city_town) LIKE CONCAT(UPPER(@cityTown), '%')`);
    params.cityTown = cityTownFilter;
  }

  // Date range filters
  if (dateFrom) {
    conditions.push(`arrest_date >= @dateFrom`);
    params.dateFrom = dateFrom;
  }

  if (dateTo) {
    conditions.push(`arrest_date <= @dateTo`);
    params.dateTo = dateTo;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Query to get city counts (aggregated)
  // Normalize city names to combine variations like "NATICK", "Natick", "NATICK, MA"
  // Remove ", MA" suffix and normalize to uppercase
  const heatmapQuery = `
    SELECT
      TRIM(REGEXP_REPLACE(UPPER(city_town), r',\\s*MA$', '')) as city,
      COUNT(*) as count
    FROM \`xcc-473.police_logs.arrest_logs\`
    ${whereClause}
    GROUP BY TRIM(REGEXP_REPLACE(UPPER(city_town), r',\\s*MA$', ''))
    ORDER BY count DESC
  `;

  const [rows] = await bq.query({
    query: heatmapQuery,
    params,
  });

  const cityCounts = rows.map((row: any) => ({
    city: row.city,
    count: Number(row.count),
  }));

  return { cityCounts };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get("city");
    const town = searchParams.get("town");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Create cache key from all parameters
    const cacheKey = `heatmap-${city || ""}-${town || ""}-${dateFrom || ""}-${
      dateTo || ""
    }`;

    // Cache the query results
    const cachedGetHeatmapData = unstable_cache(
      async () => getHeatmapData(city, town, dateFrom, dateTo),
      [cacheKey],
      {
        revalidate: 3600, // 1 hour
        tags: ["heatmap"],
      }
    );

    const data = await cachedGetHeatmapData();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("BigQuery Heatmap API Error:", error);
    console.error("Error stack:", error.stack);

    // Provide more helpful error messages
    let errorMessage = "Failed to fetch heatmap data";
    let errorDetails = error.message;

    if (error.message?.includes("Missing GCP_SERVICE_ACCOUNT_KEY")) {
      errorMessage = "BigQuery credentials not configured";
      errorDetails =
        "Please set GCP_SERVICE_ACCOUNT_KEY and GCP_PROJECT_ID environment variables";
    } else if (
      error.message?.includes("not found") ||
      error.message?.includes("does not exist")
    ) {
      errorMessage = "BigQuery table not found";
      errorDetails = `Table 'xcc-473.police_logs.arrest_logs' may not exist or you may not have access to it`;
    }

    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    );
  }
}
