import { ArrestLog } from "./types";
import { getBigQueryClient } from "./bigquery";

export interface Filters {
  town?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Charge categorization function
function categorizeCharge(charge: string): string {
  const upperCharge = charge.toUpperCase();

  if (
    upperCharge.includes("ASSAULT") ||
    upperCharge.includes("BATTERY") ||
    upperCharge.includes("ABUSE")
  ) {
    return "Assault";
  }
  if (
    upperCharge.includes("THEFT") ||
    upperCharge.includes("LARCENY") ||
    upperCharge.includes("ROBBERY") ||
    upperCharge.includes("BURGLARY")
  ) {
    return "Theft";
  }
  if (
    upperCharge.includes("DRUG") ||
    upperCharge.includes("NARCOTIC") ||
    upperCharge.includes("CONTROLLED SUBSTANCE") ||
    upperCharge.includes("POSSESSION")
  ) {
    return "Drug";
  }
  if (
    upperCharge.includes("TRAFFIC") ||
    upperCharge.includes("DUI") ||
    upperCharge.includes("DWI") ||
    upperCharge.includes("OPERATING") ||
    upperCharge.includes("LICENSE") ||
    upperCharge.includes("VEHICLE")
  ) {
    return "Traffic";
  }
  if (upperCharge.includes("WARRANT") || upperCharge.includes("FUGITIVE")) {
    return "Warrant";
  }
  if (
    upperCharge.includes("WEAPON") ||
    upperCharge.includes("FIREARM") ||
    upperCharge.includes("GUN")
  ) {
    return "Weapon";
  }
  if (
    upperCharge.includes("DISORDERLY") ||
    upperCharge.includes("DISTURBANCE") ||
    upperCharge.includes("TRESPASS")
  ) {
    return "Disorderly Conduct";
  }
  if (upperCharge.includes("DOMESTIC") || upperCharge.includes("DV")) {
    return "Domestic Violence";
  }
  if (
    upperCharge.includes("FRAUD") ||
    upperCharge.includes("FORGERY") ||
    upperCharge.includes("IDENTITY")
  ) {
    return "Fraud";
  }
  if (upperCharge.includes("VANDALISM") || upperCharge.includes("MALICIOUS")) {
    return "Vandalism";
  }

  return "Other";
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
    totalCharges: number;
    averageAge: number;
    avgChargesPerArrest: number;
  };
  topCharges: Array<{ charge: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
  dayOfWeekData: Array<{ day: string; count: number }>;
  ageDistribution: Array<{ ageRange: string; count: number }>;
  sexBreakdown: Array<{ sex: string; count: number }>;
  raceBreakdown: Array<{ race: string; count: number }>;
  chargeCategories: Array<{ category: string; count: number }>;
  chargeTrends: Array<{ date: string; category: string; count: number }>;
  chargesByAge: Array<{ ageRange: string; charge: string; count: number }>;
  chargesByRace: Array<{ race: string; charge: string; count: number }>;
  chargesBySex: Array<{ sex: string; charge: string; count: number }>;
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
  stats: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    totalCharges: number;
    averageAge: number;
    avgChargesPerArrest: number;
  };
  topCharges: Array<{ charge: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
  dayOfWeekData: Array<{ day: string; count: number }>;
  ageDistribution: Array<{ ageRange: string; count: number }>;
  sexBreakdown: Array<{ sex: string; count: number }>;
  raceBreakdown: Array<{ race: string; count: number }>;
  chargeCategories: Array<{ category: string; count: number }>;
  chargeTrends: Array<{ date: string; category: string; count: number }>;
  chargesByAge: Array<{ ageRange: string; charge: string; count: number }>;
  chargesByRace: Array<{ race: string; charge: string; count: number }>;
  chargesBySex: Array<{ sex: string; charge: string; count: number }>;
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

  // Calculate date range for timeline aggregation
  let timelineAggregation = "DAY"; // default
  if (filters.dateFrom && filters.dateTo) {
    const dateFrom = new Date(filters.dateFrom);
    const dateTo = new Date(filters.dateTo);
    const daysDiff = Math.ceil(
      (dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff > 365) {
      timelineAggregation = "MONTH";
    } else if (daysDiff > 30) {
      timelineAggregation = "WEEK";
    }
  } else {
    // If no date filter, check overall data range
    // For now, default to WEEK for better readability
    timelineAggregation = "WEEK";
  }

  // Prepare conditions for age, sex, and race queries with data quality filters
  const ageConditions = [...conditions];
  ageConditions.push("age IS NOT NULL");
  ageConditions.push("age > 0");
  const ageWhereClause =
    ageConditions.length > 0 ? `WHERE ${ageConditions.join(" AND ")}` : "";

  const sexConditions = [...conditions];
  sexConditions.push("sex IS NOT NULL");
  sexConditions.push("sex != 'U'");
  const sexWhereClause =
    sexConditions.length > 0 ? `WHERE ${sexConditions.join(" AND ")}` : "";

  const raceConditions = [...conditions];
  raceConditions.push("race IS NOT NULL");
  raceConditions.push("race != 'U'");
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
    [chargesWithDatesRows],
    [chargesWithDemographicsRows],
  ] = await Promise.all([
    // Stats query
    bq.query({
      query: `
        SELECT
          COUNT(*) as total,
          COUNTIF(arrest_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)) as thisWeek,
          COUNTIF(arrest_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) as thisMonth,
          AVG(CASE WHEN age IS NOT NULL AND age > 0 THEN age ELSE NULL END) as averageAge
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${whereClause}
      `,
      params,
    }),
    // Top cities query (normalized like heatmap)
    bq.query({
      query: `
        SELECT
          TRIM(REGEXP_REPLACE(UPPER(city_town), r',\\s*MA$', '')) as city,
          COUNT(*) as count
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${whereClause}
        GROUP BY TRIM(REGEXP_REPLACE(UPPER(city_town), r',\\s*MA$', ''))
        ORDER BY count DESC
        LIMIT 10
      `,
      params,
    }),
    // Timeline query (aggregated by week or month)
    bq.query({
      query: `
        SELECT
          DATE_TRUNC(arrest_date, ${
            timelineAggregation === "MONTH"
              ? "MONTH"
              : timelineAggregation === "WEEK"
              ? "WEEK"
              : "DAY"
          }) as date,
          COUNT(*) as count
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${whereClause}
        GROUP BY DATE_TRUNC(arrest_date, ${
          timelineAggregation === "MONTH"
            ? "MONTH"
            : timelineAggregation === "WEEK"
            ? "WEEK"
            : "DAY"
        })
        ORDER BY date ASC
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
    // Charges with dates for trends
    bq.query({
      query: `
        SELECT
          DATE_TRUNC(arrest_date, ${
            timelineAggregation === "MONTH"
              ? "MONTH"
              : timelineAggregation === "WEEK"
              ? "WEEK"
              : "DAY"
          }) as date,
          charges
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${whereClause}
      `,
      params,
    }),
    // Charges with demographics
    bq.query({
      query: `
        SELECT
          charges,
          CASE
            WHEN age IS NOT NULL AND age > 0 AND age < 18 THEN '0-17'
            WHEN age IS NOT NULL AND age > 0 AND age < 25 THEN '18-24'
            WHEN age IS NOT NULL AND age > 0 AND age < 35 THEN '25-34'
            WHEN age IS NOT NULL AND age > 0 AND age < 45 THEN '35-44'
            WHEN age IS NOT NULL AND age > 0 AND age < 55 THEN '45-54'
            WHEN age IS NOT NULL AND age > 0 AND age < 65 THEN '55-64'
            WHEN age IS NOT NULL AND age > 0 THEN '65+'
            ELSE NULL
          END as age_range,
          CASE WHEN sex IS NOT NULL AND sex != 'U' THEN sex ELSE NULL END as sex,
          CASE WHEN race IS NOT NULL AND race != 'U' THEN race ELSE NULL END as race
        FROM \`xcc-473.police_logs.arrest_logs\`
        ${whereClause}
      `,
      params,
    }),
  ]);

  // Process results
  const statsRow = statsRows[0] as any;

  // Calculate total charges by counting all individual charges
  let totalCharges = 0;
  chargesRows.forEach((row: any) => {
    if (row.charges) {
      const charges = row.charges
        .split(",")
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0);
      totalCharges += charges.length;
    }
  });

  const total = Number(statsRow.total);
  const averageAge = statsRow.averageAge ? Number(statsRow.averageAge) : 0;
  const avgChargesPerArrest = total > 0 ? totalCharges / total : 0;

  const stats = {
    total,
    thisWeek: Number(statsRow.thisWeek),
    thisMonth: Number(statsRow.thisMonth),
    totalCharges,
    averageAge: Math.round(averageAge * 10) / 10, // Round to 1 decimal place
    avgChargesPerArrest: Math.round(avgChargesPerArrest * 10) / 10, // Round to 1 decimal place
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
  const chargeCategoryCounts: Record<string, number> = {};
  chargesRows.forEach((row: any) => {
    if (row.charges) {
      const charges = row.charges
        .split(",")
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0);
      charges.forEach((charge: string) => {
        chargeCounts[charge] = (chargeCounts[charge] || 0) + 1;
        const category = categorizeCharge(charge);
        chargeCategoryCounts[category] =
          (chargeCategoryCounts[category] || 0) + 1;
      });
    }
  });

  const topCharges = Object.entries(chargeCounts)
    .map(([charge, count]) => ({ charge, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const chargeCategories = Object.entries(chargeCategoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

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

  const sexBreakdown = sexBreakdownRows
    .filter((row: any) => row.sex && row.sex !== "U")
    .map((row: any) => ({
      sex: row.sex || "Unknown",
      count: Number(row.count),
    }));

  const raceBreakdown = raceBreakdownRows
    .filter((row: any) => row.race && row.race !== "U")
    .map((row: any) => ({
      race: row.race || "Unknown",
      count: Number(row.count),
    }));

  // Process charge trends over time
  const chargeTrendsMap: Record<string, Record<string, number>> = {};
  chargesWithDatesRows.forEach((row: any) => {
    const serialized = serializeBigQueryRow(row);
    const dateValue =
      typeof serialized.date === "string"
        ? serialized.date
        : serialized.date?.value || row.date?.value || row.date;
    const dateStr = dateValue
      ? new Date(dateValue).toISOString().split("T")[0]
      : "";

    if (row.charges && dateStr) {
      const charges = row.charges
        .split(",")
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0);
      charges.forEach((charge: string) => {
        const category = categorizeCharge(charge);
        if (!chargeTrendsMap[dateStr]) {
          chargeTrendsMap[dateStr] = {};
        }
        chargeTrendsMap[dateStr][category] =
          (chargeTrendsMap[dateStr][category] || 0) + 1;
      });
    }
  });

  const chargeTrends: Array<{ date: string; category: string; count: number }> =
    [];
  Object.entries(chargeTrendsMap).forEach(([date, categories]) => {
    Object.entries(categories).forEach(([category, count]) => {
      chargeTrends.push({ date, category, count: Number(count) });
    });
  });

  // Process charges by demographics
  const chargesByAgeMap: Record<string, Record<string, number>> = {};
  const chargesByRaceMap: Record<string, Record<string, number>> = {};
  const chargesBySexMap: Record<string, Record<string, number>> = {};

  chargesWithDemographicsRows.forEach((row: any) => {
    if (row.charges) {
      const charges = row.charges
        .split(",")
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0);

      charges.forEach((charge: string) => {
        // By age
        if (row.age_range) {
          if (!chargesByAgeMap[row.age_range]) {
            chargesByAgeMap[row.age_range] = {};
          }
          chargesByAgeMap[row.age_range][charge] =
            (chargesByAgeMap[row.age_range][charge] || 0) + 1;
        }

        // By race
        if (row.race) {
          if (!chargesByRaceMap[row.race]) {
            chargesByRaceMap[row.race] = {};
          }
          chargesByRaceMap[row.race][charge] =
            (chargesByRaceMap[row.race][charge] || 0) + 1;
        }

        // By sex
        if (row.sex) {
          if (!chargesBySexMap[row.sex]) {
            chargesBySexMap[row.sex] = {};
          }
          chargesBySexMap[row.sex][charge] =
            (chargesBySexMap[row.sex][charge] || 0) + 1;
        }
      });
    }
  });

  // Convert to arrays and get top charges for each demographic
  const chargesByAge: Array<{
    ageRange: string;
    charge: string;
    count: number;
  }> = [];
  Object.entries(chargesByAgeMap).forEach(([ageRange, chargeCounts]) => {
    const topChargesForAge = Object.entries(chargeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([charge, count]) => ({ ageRange, charge, count: Number(count) }));
    chargesByAge.push(...topChargesForAge);
  });

  const chargesByRace: Array<{ race: string; charge: string; count: number }> =
    [];
  Object.entries(chargesByRaceMap).forEach(([race, chargeCounts]) => {
    const topChargesForRace = Object.entries(chargeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([charge, count]) => ({ race, charge, count: Number(count) }));
    chargesByRace.push(...topChargesForRace);
  });

  const chargesBySex: Array<{ sex: string; charge: string; count: number }> =
    [];
  Object.entries(chargesBySexMap).forEach(([sex, chargeCounts]) => {
    const topChargesForSex = Object.entries(chargeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([charge, count]) => ({ sex, charge, count: Number(count) }));
    chargesBySex.push(...topChargesForSex);
  });

  return {
    stats,
    topCharges,
    topCities,
    timelineData,
    dayOfWeekData,
    ageDistribution,
    sexBreakdown,
    raceBreakdown,
    chargeCategories,
    chargeTrends,
    chargesByAge,
    chargesByRace,
    chargesBySex,
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
      chargeCategories: statsData.chargeCategories,
      chargeTrends: statsData.chargeTrends,
      chargesByAge: statsData.chargesByAge,
      chargesByRace: statsData.chargesByRace,
      chargesBySex: statsData.chargesBySex,
    };
  } catch (error) {
    console.error("Error fetching app data:", error);
    return {
      arrests: [],
      total: 0,
      stats: {
        total: 0,
        thisWeek: 0,
        thisMonth: 0,
        totalCharges: 0,
        averageAge: 0,
        avgChargesPerArrest: 0,
      },
      topCharges: [],
      topCities: [],
      timelineData: [],
      dayOfWeekData: [],
      ageDistribution: [],
      sexBreakdown: [],
      raceBreakdown: [],
      chargeCategories: [],
      chargeTrends: [],
      chargesByAge: [],
      chargesByRace: [],
      chargesBySex: [],
    };
  }
}
