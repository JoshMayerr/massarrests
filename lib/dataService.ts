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
  dayOfWeekData: Array<{ day: string; count: number }>;
  ageDistribution: Array<{ ageRange: string; count: number }>;
  sexBreakdown: Array<{ sex: string; count: number }>;
  raceBreakdown: Array<{ race: string; count: number }>;
}

export async function fetchArrests(filters: Filters = {}): Promise<{
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

export async function fetchStats(filters: Filters = {}): Promise<{
  stats: { total: number; thisWeek: number; thisMonth: number };
  topCharges: Array<{ charge: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
  dayOfWeekData: Array<{ day: string; count: number }>;
  ageDistribution: Array<{ ageRange: string; count: number }>;
  sexBreakdown: Array<{ sex: string; count: number }>;
  raceBreakdown: Array<{ race: string; count: number }>;
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

  // Prepare conditions for age, sex, and race queries
  const ageConditions = [...conditions];
  ageConditions.push("age IS NOT NULL");
  const ageWhereClause =
    ageConditions.length > 0 ? `WHERE ${ageConditions.join(" AND ")}` : "";

  const sexConditions = [...conditions];
  sexConditions.push("sex IS NOT NULL");
  const sexWhereClause =
    sexConditions.length > 0 ? `WHERE ${sexConditions.join(" AND ")}` : "";

  const raceConditions = [...conditions];
  raceConditions.push("race IS NOT NULL");
  const raceWhereClause =
    raceConditions.length > 0 ? `WHERE ${raceConditions.join(" AND ")}` : "";

  // Run all independent queries in parallel for better performance
  const [
    [statsRows],
    [topCitiesRows],
    [timelineRows],
    [chargesRows],
    [dayOfWeekRows],
    [ageDistributionRows],
    [sexBreakdownRows],
    [raceBreakdownRows],
  ] = await Promise.all([
    // Stats query
    bq.query({
      query: `
        SELECT
          COUNT(*) as total,
          COUNTIF(arrest_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)) as thisWeek,
          COUNTIF(arrest_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) as thisMonth
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${whereClause}
      `,
      params,
    }),
    // Top cities query
    bq.query({
      query: `
        SELECT
          city_town as city,
          COUNT(*) as count
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${whereClause}
        GROUP BY city_town
        ORDER BY count DESC
        LIMIT 10
      `,
      params,
    }),
    // Timeline query
    bq.query({
      query: `
        SELECT
          arrest_date as date,
          COUNT(*) as count
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${whereClause}
        GROUP BY arrest_date
        ORDER BY arrest_date ASC
      `,
      params,
    }),
    // Charges query (needs post-processing)
    bq.query({
      query: `
        SELECT charges
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${whereClause}
      `,
      params,
    }),
    // Day of week query
    bq.query({
      query: `
        SELECT
          EXTRACT(DAYOFWEEK FROM arrest_date) as day_of_week,
          COUNT(*) as count
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${whereClause}
        GROUP BY day_of_week
        ORDER BY day_of_week
      `,
      params,
    }),
    // Age distribution query
    bq.query({
      query: `
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
      `,
      params,
    }),
    // Sex breakdown query
    bq.query({
      query: `
        SELECT
          sex,
          COUNT(*) as count
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${sexWhereClause}
        GROUP BY sex
        ORDER BY count DESC
      `,
      params,
    }),
    // Race breakdown query
    bq.query({
      query: `
        SELECT
          race,
          COUNT(*) as count
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${raceWhereClause}
        GROUP BY race
        ORDER BY count DESC
      `,
      params,
    }),
  ]);

  // Process results
  const statsRow = statsRows[0] as any;
  const stats = {
    total: Number(statsRow.total),
    thisWeek: Number(statsRow.thisWeek),
    thisMonth: Number(statsRow.thisMonth),
  };

  const topCities = topCitiesRows.map((row: any) => ({
    city: row.city,
    count: Number(row.count),
  }));

  const timelineData = timelineRows.map((row: any) => {
    const serialized = serializeBigQueryRow(row);
    const dateValue =
      typeof serialized.date === "string"
        ? serialized.date
        : serialized.date?.value || row.date?.value || row.date;
    return {
      date: dateValue,
      count: Number(row.count),
    };
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

  const topCharges = Object.entries(chargeCounts)
    .map(([charge, count]) => ({ charge, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

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

  const ageDistribution = ageDistributionRows.map((row: any) => ({
    ageRange: row.age_range,
    count: Number(row.count),
  }));

  const sexBreakdown = sexBreakdownRows.map((row: any) => ({
    sex: row.sex || "Unknown",
    count: Number(row.count),
  }));

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
      dayOfWeekData: statsData.dayOfWeekData,
      ageDistribution: statsData.ageDistribution,
      sexBreakdown: statsData.sexBreakdown,
      raceBreakdown: statsData.raceBreakdown,
    };
  } catch (error) {
    console.error("Error fetching app data:", error);
    return {
      arrests: [],
      total: 0,
      stats: { total: 0, thisWeek: 0, thisMonth: 0 },
      topCharges: [],
      topCities: [],
      timelineData: [],
      dayOfWeekData: [],
      ageDistribution: [],
      sexBreakdown: [],
      raceBreakdown: [],
    };
  }
}
