import { ArrestLog } from "./types";
import { getBigQueryClient } from "./bigquery";

export interface Filters {
  town?: string;
  dateFrom?: string;
  dateTo?: string;
}

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

interface AppData {
  arrests: ArrestLog[];
  total: number;
  stats: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  topCharges: Array<{ charge: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
}

async function fetchArrests(filters: Filters = {}): Promise<{
  arrests: ArrestLog[];
  total: number;
}> {
  const bq = await getBigQueryClient();

  // Build WHERE clause conditions for both queries
  const conditions: string[] = [];
  const params: any = {};

  // City/Town filter
  if (filters.town) {
    conditions.push(`UPPER(city_town) LIKE CONCAT(UPPER(@town), '%')`);
    params.town = filters.town;
  }

  // Date range filters
  if (filters.dateFrom) {
    conditions.push(`arrest_date >= @dateFrom`);
    params.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    conditions.push(`arrest_date <= @dateTo`);
    params.dateTo = filters.dateTo;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Construct the SQL query for arrests
  let query = `
    SELECT
      arrest_id, first_name, last_name, age, sex, race,
      charges, arrest_date, arrest_time, city_town,
      street_line, zip_code, processing_time, source_file
    FROM \`xcc-473.police_logs.arrest_logs\`
    ${whereClause}
    ORDER BY arrest_date DESC
    LIMIT 100
  `;

  // Get total count for pagination (separate query)
  let countQuery = `
    SELECT COUNT(*) as total
    FROM \`xcc-473.police_logs.arrest_logs\`
    ${whereClause}
  `;

  const countParams = { ...params };

  // Run both queries in parallel
  const [[rows], [countRows]] = await Promise.all([
    bq.query({ query, params }),
    bq.query({ query: countQuery, params: countParams }),
  ]);

  const total = Number((countRows[0] as any).total);

  // Serialize BigQuery rows to plain objects for Client Components
  const serializedArrests = rows.map((row: any) =>
    serializeBigQueryRow(row)
  ) as ArrestLog[];

  return {
    arrests: serializedArrests,
    total,
  };
}

async function fetchStats(filters: Filters = {}): Promise<{
  stats: { total: number; thisWeek: number; thisMonth: number };
  topCharges: Array<{ charge: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
}> {
  const bq = await getBigQueryClient();

  // Build WHERE clause conditions
  const conditions: string[] = [];
  const params: any = {};

  if (filters.town) {
    conditions.push(`UPPER(city_town) LIKE CONCAT(UPPER(@town), '%')`);
    params.town = filters.town;
  }

  if (filters.dateFrom) {
    conditions.push(`arrest_date >= @dateFrom`);
    params.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    conditions.push(`arrest_date <= @dateTo`);
    params.dateTo = filters.dateTo;
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
    .slice(0, 20);

  return {
    stats,
    topCharges,
    topCities,
    timelineData,
  };
}

export async function fetchHeatmapData(
  filters: Filters = {}
): Promise<Array<{ city: string; count: number }>> {
  const bq = await getBigQueryClient();

  // Build WHERE clause conditions
  const conditions: string[] = [];
  const params: any = {};

  if (filters.town) {
    conditions.push(`UPPER(city_town) LIKE CONCAT(UPPER(@town), '%')`);
    params.town = filters.town;
  }

  if (filters.dateFrom) {
    conditions.push(`arrest_date >= @dateFrom`);
    params.dateFrom = filters.dateFrom;
  }

  if (filters.dateTo) {
    conditions.push(`arrest_date <= @dateTo`);
    params.dateTo = filters.dateTo;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Query to get city counts (aggregated)
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

  return rows.map((row: any) => ({
    city: row.city,
    count: Number(row.count),
  }));
}

export async function getAppData(filters: Filters = {}): Promise<AppData> {
  try {
    // Fetch arrests and stats in parallel
    const [arrestsData, statsData] = await Promise.all([
      fetchArrests(filters),
      fetchStats(filters),
    ]);

    console.log("Fetched app data:", {
      filters,
      arrestsCount: arrestsData.arrests.length,
      total: arrestsData.total,
      stats: statsData.stats,
      topChargesCount: statsData.topCharges.length,
      topCitiesCount: statsData.topCities.length,
      timelineDataCount: statsData.timelineData.length,
    });

    return {
      arrests: arrestsData.arrests,
      total: arrestsData.total,
      stats: statsData.stats,
      topCharges: statsData.topCharges,
      topCities: statsData.topCities,
      timelineData: statsData.timelineData,
    };
  } catch (error) {
    console.error("Error getting app data:", error);
    // Return empty data as fallback
    return {
      arrests: [],
      total: 0,
      stats: { total: 0, thisWeek: 0, thisMonth: 0 },
      topCharges: [],
      topCities: [],
      timelineData: [],
    };
  }
}
