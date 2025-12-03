import { NextRequest, NextResponse } from "next/server";
import { getBigQueryClient } from "@/lib/bigquery";

export const dynamic = "force-dynamic"; // Prevent static caching of this route

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const town = searchParams.get("town");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Initialize the authenticated BigQuery client
    const bq = await getBigQueryClient();

    // Build WHERE clause conditions
    const conditions: string[] = [];
    const params: any = {};

    if (town) {
      // Use LIKE to match variations like "NATICK", "Natick", "NATICK, MA"
      conditions.push(`UPPER(city_town) LIKE CONCAT(UPPER(@town), '%')`);
      params.town = town;
    }

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

    // Calculate stats: total, thisWeek, thisMonth
    const statsQuery = `
      SELECT
        COUNT(*) as total,
        COUNTIF(arrest_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)) as thisWeek,
        COUNTIF(arrest_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) as thisMonth
      FROM \`xcc-473.police_logs.arrest_logs\`
      ${whereClause}
    `;

    const [statsRows] = await bq.query({
      query: statsQuery,
      params,
    });

    const statsRow = statsRows[0] as any;
    const stats = {
      total: Number(statsRow.total),
      thisWeek: Number(statsRow.thisWeek),
      thisMonth: Number(statsRow.thisMonth),
    };

    // Get top cities
    const topCitiesQuery = `
      SELECT
        city_town as city,
        COUNT(*) as count
      FROM \`xcc-473.police_logs.arrest_logs\`
      ${whereClause}
      GROUP BY city_town
      ORDER BY count DESC
      LIMIT 10
    `;

    const [topCitiesRows] = await bq.query({
      query: topCitiesQuery,
      params,
    });

    const topCities = topCitiesRows.map((row: any) => ({
      city: row.city,
      count: Number(row.count),
    }));

    // Get timeline data (grouped by date)
    const timelineQuery = `
      SELECT
        arrest_date as date,
        COUNT(*) as count
      FROM \`xcc-473.police_logs.arrest_logs\`
      ${whereClause}
      GROUP BY arrest_date
      ORDER BY arrest_date ASC
    `;

    const [timelineRows] = await bq.query({
      query: timelineQuery,
      params,
    });

    const timelineData = timelineRows.map((row: any) => ({
      date: row.date,
      count: Number(row.count),
    }));

    // Get top charges by parsing the charges field
    // We'll fetch all charges and parse them in JavaScript
    const chargesQuery = `
      SELECT charges
      FROM \`xcc-473.police_logs.arrest_logs\`
      ${whereClause}
    `;

    const [chargesRows] = await bq.query({
      query: chargesQuery,
      params,
    });

    // Parse charges string and aggregate
    const chargeCounts: Record<string, number> = {};
    chargesRows.forEach((row: any) => {
      if (row.charges) {
        // Split by comma and trim each charge
        const charges = row.charges
          .split(",")
          .map((c: string) => c.trim())
          .filter((c: string) => c.length > 0);
        charges.forEach((charge: string) => {
          chargeCounts[charge] = (chargeCounts[charge] || 0) + 1;
        });
      }
    });

    // Convert to array and sort by count
    const topCharges = Object.entries(chargeCounts)
      .map(([charge, count]) => ({ charge, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 charges

    return NextResponse.json({
      stats,
      topCharges,
      topCities,
      timelineData,
    });
  } catch (error: any) {
    console.error("BigQuery Stats API Error:", error);
    console.error("Error stack:", error.stack);

    // Provide more helpful error messages
    let errorMessage = "Failed to fetch stats";
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
