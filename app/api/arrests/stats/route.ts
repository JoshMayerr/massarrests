import { NextRequest, NextResponse } from "next/server";
import { getBigQueryClient } from "@/lib/bigquery";
import { unstable_cache } from "next/cache";

export const revalidate = 3600; // Cache for 1 hour

// Serialize BigQuery results to plain objects for Client Components
// BigQuery returns DATE/TIMESTAMP fields as objects with a 'value' property
function serializeBigQueryRow(row: any): any {
  const serialized: any = {};
  for (const [key, value] of Object.entries(row)) {
    // Handle DATE/TIMESTAMP objects from BigQuery
    if (value && typeof value === "object" && "value" in value) {
      serialized[key] = value.value;
    } else {
      serialized[key] = value;
    }
  }
  return serialized;
}

async function getStatsData(
  town: string | null,
  dateFrom: string | null,
  dateTo: string | null
) {
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

  const timelineData = timelineRows.map((row: any) => {
    const serialized = serializeBigQueryRow(row);
    // Handle date field - could be string or object with value property
    const dateValue =
      typeof serialized.date === "string"
        ? serialized.date
        : serialized.date?.value || row.date?.value || row.date;
    return {
      date: dateValue,
      count: Number(row.count),
    };
  });

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

  // Get day of week data
  const dayOfWeekQuery = `
    SELECT
      EXTRACT(DAYOFWEEK FROM arrest_date) as day_of_week,
      COUNT(*) as count
    FROM \`xcc-473.police_logs.arrest_logs\`
    ${whereClause}
    GROUP BY day_of_week
    ORDER BY day_of_week
  `;

  const [dayOfWeekRows] = await bq.query({
    query: dayOfWeekQuery,
    params,
  });

  // Map day numbers to day names (1=Sunday, 7=Saturday in BigQuery)
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayOfWeekData = dayOfWeekRows.map((row: any) => {
    const dayNum = Number(row.day_of_week);
    return {
      day: dayNames[dayNum - 1] || `Day ${dayNum}`,
      count: Number(row.count),
    };
  });

  // Get age distribution
  const ageConditions = [...conditions];
  ageConditions.push("age IS NOT NULL");
  const ageWhereClause =
    ageConditions.length > 0 ? `WHERE ${ageConditions.join(" AND ")}` : "";

  const ageDistributionQuery = `
    SELECT
      CASE
        WHEN age < 18 THEN '0-17'
        WHEN age < 25 THEN '18-24'
        WHEN age < 35 THEN '25-34'
        WHEN age < 45 THEN '35-44'
        WHEN age < 55 THEN '45-54'
        WHEN age < 65 THEN '55-64'
        ELSE '65+'
      END as age_range,
      COUNT(*) as count
    FROM \`xcc-473.police_logs.arrest_logs\`
    ${ageWhereClause}
    GROUP BY age_range
    ORDER BY
      CASE age_range
        WHEN '0-17' THEN 1
        WHEN '18-24' THEN 2
        WHEN '25-34' THEN 3
        WHEN '35-44' THEN 4
        WHEN '45-54' THEN 5
        WHEN '55-64' THEN 6
        WHEN '65+' THEN 7
      END
  `;

  const [ageDistributionRows] = await bq.query({
    query: ageDistributionQuery,
    params,
  });

  const ageDistribution = ageDistributionRows.map((row: any) => ({
    ageRange: row.age_range,
    count: Number(row.count),
  }));

  // Get sex breakdown
  const sexConditions = [...conditions];
  sexConditions.push("sex IS NOT NULL");
  const sexWhereClause =
    sexConditions.length > 0 ? `WHERE ${sexConditions.join(" AND ")}` : "";

  const sexBreakdownQuery = `
    SELECT
      sex,
      COUNT(*) as count
    FROM \`xcc-473.police_logs.arrest_logs\`
    ${sexWhereClause}
    GROUP BY sex
    ORDER BY count DESC
  `;

  const [sexBreakdownRows] = await bq.query({
    query: sexBreakdownQuery,
    params,
  });

  const sexBreakdown = sexBreakdownRows.map((row: any) => ({
    sex: row.sex || "Unknown",
    count: Number(row.count),
  }));

  // Get race breakdown
  const raceConditions = [...conditions];
  raceConditions.push("race IS NOT NULL");
  const raceWhereClause =
    raceConditions.length > 0 ? `WHERE ${raceConditions.join(" AND ")}` : "";

  const raceBreakdownQuery = `
    SELECT
      race,
      COUNT(*) as count
    FROM \`xcc-473.police_logs.arrest_logs\`
    ${raceWhereClause}
    GROUP BY race
    ORDER BY count DESC
  `;

  const [raceBreakdownRows] = await bq.query({
    query: raceBreakdownQuery,
    params,
  });

  const raceBreakdown = raceBreakdownRows.map((row: any) => ({
    race: row.race || "Unknown",
    count: Number(row.count),
  }));

  return {
    stats,
    topCharges,
    topCities,
    timelineData,
    dayOfWeekData,
    ageDistribution,
    sexBreakdown,
    raceBreakdown,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const town = searchParams.get("town");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Create cache key from all parameters
    const cacheKey = `stats-${town || ""}-${dateFrom || ""}-${dateTo || ""}`;

    // Cache the query results
    const cachedGetStatsData = unstable_cache(
      async () => getStatsData(town, dateFrom, dateTo),
      [cacheKey],
      {
        revalidate: 3600, // 1 hour
        tags: ["stats"],
      }
    );

    const data = await cachedGetStatsData();

    return NextResponse.json(data);
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
