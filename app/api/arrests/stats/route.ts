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

// Charge categorization function
function categorizeCharge(charge: string): string {
  const upperCharge = charge.toUpperCase();

  if (upperCharge.includes("ASSAULT") || upperCharge.includes("BATTERY") || upperCharge.includes("ABUSE")) {
    return "Assault";
  }
  if (upperCharge.includes("THEFT") || upperCharge.includes("LARCENY") || upperCharge.includes("ROBBERY") || upperCharge.includes("BURGLARY")) {
    return "Theft";
  }
  if (upperCharge.includes("DRUG") || upperCharge.includes("NARCOTIC") || upperCharge.includes("CONTROLLED SUBSTANCE") || upperCharge.includes("POSSESSION")) {
    return "Drug";
  }
  if (upperCharge.includes("TRAFFIC") || upperCharge.includes("DUI") || upperCharge.includes("DWI") || upperCharge.includes("OPERATING") || upperCharge.includes("LICENSE") || upperCharge.includes("VEHICLE")) {
    return "Traffic";
  }
  if (upperCharge.includes("WARRANT") || upperCharge.includes("FUGITIVE")) {
    return "Warrant";
  }
  if (upperCharge.includes("WEAPON") || upperCharge.includes("FIREARM") || upperCharge.includes("GUN")) {
    return "Weapon";
  }
  if (upperCharge.includes("DISORDERLY") || upperCharge.includes("DISTURBANCE") || upperCharge.includes("TRESPASS")) {
    return "Disorderly Conduct";
  }
  if (upperCharge.includes("DOMESTIC") || upperCharge.includes("DV")) {
    return "Domestic Violence";
  }
  if (upperCharge.includes("FRAUD") || upperCharge.includes("FORGERY") || upperCharge.includes("IDENTITY")) {
    return "Fraud";
  }
  if (upperCharge.includes("VANDALISM") || upperCharge.includes("MALICIOUS")) {
    return "Vandalism";
  }

  return "Other";
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

  // Calculate date range for timeline aggregation
  let timelineAggregation = "DAY"; // default
  if (dateFrom && dateTo) {
    const dateFromObj = new Date(dateFrom);
    const dateToObj = new Date(dateTo);
    const daysDiff = Math.ceil((dateToObj.getTime() - dateFromObj.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff > 365) {
      timelineAggregation = "MONTH";
    } else if (daysDiff > 30) {
      timelineAggregation = "WEEK";
    }
  } else {
    // If no date filter, default to WEEK for better readability
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

  // Calculate stats: total, thisWeek, thisMonth, averageAge
  const statsQuery = `
    SELECT
      COUNT(*) as total,
      COUNTIF(arrest_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)) as thisWeek,
      COUNTIF(arrest_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) as thisMonth,
      AVG(CASE WHEN age IS NOT NULL AND age > 0 THEN age ELSE NULL END) as averageAge
    FROM \`xcc-473.police_logs.arrest_logs\`
    ${whereClause}
  `;

  const [statsRows] = await bq.query({
    query: statsQuery,
    params,
  });

  // Get top cities (normalized like heatmap)
  const topCitiesQuery = `
    SELECT
      TRIM(REGEXP_REPLACE(UPPER(city_town), r',\\s*MA$', '')) as city,
      COUNT(*) as count
    FROM \`xcc-473.police_logs.arrest_logs\`
    ${whereClause}
    GROUP BY TRIM(REGEXP_REPLACE(UPPER(city_town), r',\\s*MA$', ''))
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

  // Get timeline data (aggregated by week or month)
  const timelineQuery = `
    SELECT
      DATE_TRUNC(arrest_date, ${timelineAggregation === "MONTH" ? "MONTH" : timelineAggregation === "WEEK" ? "WEEK" : "DAY"}) as date,
      COUNT(*) as count
    FROM \`xcc-473.police_logs.arrest_logs\`
    ${whereClause}
    GROUP BY DATE_TRUNC(arrest_date, ${timelineAggregation === "MONTH" ? "MONTH" : timelineAggregation === "WEEK" ? "WEEK" : "DAY"})
    ORDER BY date ASC
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
  const chargeCategoryCounts: Record<string, number> = {};
  let totalCharges = 0;
  chargesRows.forEach((row: any) => {
    if (row.charges) {
      // Split by comma and trim each charge
      const charges = row.charges
        .split(",")
        .map((c: string) => c.trim())
        .filter((c: string) => c.length > 0);
      totalCharges += charges.length;
      charges.forEach((charge: string) => {
        chargeCounts[charge] = (chargeCounts[charge] || 0) + 1;
        const category = categorizeCharge(charge);
        chargeCategoryCounts[category] = (chargeCategoryCounts[category] || 0) + 1;
      });
    }
  });

  const statsRow = statsRows[0] as any;
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

  // Convert to array and sort by count
  const topCharges = Object.entries(chargeCounts)
    .map(([charge, count]) => ({ charge, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20); // Top 20 charges

  const chargeCategories = Object.entries(chargeCategoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

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

  // Get age distribution (already has filters applied above)
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

  // Get sex breakdown (already has filters applied above)
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

  const sexBreakdown = sexBreakdownRows
    .filter((row: any) => row.sex && row.sex !== "U")
    .map((row: any) => ({
      sex: row.sex || "Unknown",
      count: Number(row.count),
    }));

  // Get race breakdown (already has filters applied above)
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

  const raceBreakdown = raceBreakdownRows
    .filter((row: any) => row.race && row.race !== "U")
    .map((row: any) => ({
      race: row.race || "Unknown",
      count: Number(row.count),
    }));

  // Get charges with dates for trends
  const chargesWithDatesQuery = `
    SELECT
      DATE_TRUNC(arrest_date, ${timelineAggregation === "MONTH" ? "MONTH" : timelineAggregation === "WEEK" ? "WEEK" : "DAY"}) as date,
      charges
    FROM \`xcc-473.police_logs.arrest_logs\`
    ${whereClause}
  `;

  const [chargesWithDatesRows] = await bq.query({
    query: chargesWithDatesQuery,
    params,
  });

  // Get charges with demographics
  const chargesWithDemographicsQuery = `
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
  `;

  const [chargesWithDemographicsRows] = await bq.query({
    query: chargesWithDemographicsQuery,
    params,
  });

  // Process charge trends over time
  const chargeTrendsMap: Record<string, Record<string, number>> = {};
  chargesWithDatesRows.forEach((row: any) => {
    const serialized = serializeBigQueryRow(row);
    const dateValue =
      typeof serialized.date === "string"
        ? serialized.date
        : serialized.date?.value || row.date?.value || row.date;
    const dateStr = dateValue ? new Date(dateValue).toISOString().split("T")[0] : "";

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
        chargeTrendsMap[dateStr][category] = (chargeTrendsMap[dateStr][category] || 0) + 1;
      });
    }
  });

  const chargeTrends: Array<{ date: string; category: string; count: number }> = [];
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
          chargesByAgeMap[row.age_range][charge] = (chargesByAgeMap[row.age_range][charge] || 0) + 1;
        }

        // By race
        if (row.race) {
          if (!chargesByRaceMap[row.race]) {
            chargesByRaceMap[row.race] = {};
          }
          chargesByRaceMap[row.race][charge] = (chargesByRaceMap[row.race][charge] || 0) + 1;
        }

        // By sex
        if (row.sex) {
          if (!chargesBySexMap[row.sex]) {
            chargesBySexMap[row.sex] = {};
          }
          chargesBySexMap[row.sex][charge] = (chargesBySexMap[row.sex][charge] || 0) + 1;
        }
      });
    }
  });

  // Convert to arrays and get top charges for each demographic
  const chargesByAge: Array<{ ageRange: string; charge: string; count: number }> = [];
  Object.entries(chargesByAgeMap).forEach(([ageRange, chargeCounts]) => {
    const topChargesForAge = Object.entries(chargeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([charge, count]) => ({ ageRange, charge, count: Number(count) }));
    chargesByAge.push(...topChargesForAge);
  });

  const chargesByRace: Array<{ race: string; charge: string; count: number }> = [];
  Object.entries(chargesByRaceMap).forEach(([race, chargeCounts]) => {
    const topChargesForRace = Object.entries(chargeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([charge, count]) => ({ race, charge, count: Number(count) }));
    chargesByRace.push(...topChargesForRace);
  });

  const chargesBySex: Array<{ sex: string; charge: string; count: number }> = [];
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
