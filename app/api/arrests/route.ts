import { NextRequest, NextResponse } from "next/server";
import { getBigQueryClient } from "@/lib/bigquery";
import { ArrestLog, ArrestApiResponse } from "@/lib/types";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";
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

async function getArrestsData(
  page: number,
  limit: number,
  city: string | null,
  town: string | null,
  search: string,
  dateFrom: string | null,
  dateTo: string | null
) {
  // Initialize the authenticated BigQuery client
  const bq = await getBigQueryClient();

  // Construct the SQL query
  // NOTE: Always use parameterized queries (@param) to prevent SQL injection
  let query = `
    SELECT
      arrest_id, first_name, last_name, age, sex, race,
      charges, arrest_date, arrest_time, city_town,
      street_line, zip_code, processing_time, source_file
    FROM \`xcc-473.police_logs.arrest_logs\`
  `;

  const params: any = {};
  const conditions: string[] = [];

  // Search filter (name or charges)
  if (search) {
    conditions.push(
      `(first_name LIKE @search OR last_name LIKE @search OR charges LIKE @search)`
    );
    params.search = `%${search}%`;
  }

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

  // Add WHERE clause if we have conditions
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  // Order by date (most recent first) and add pagination
  query += ` ORDER BY arrest_date DESC`;

  // Calculate offset for pagination
  const offset = (page - 1) * limit;
  query += ` LIMIT @limit OFFSET @offset`;
  params.limit = limit;
  params.offset = offset;

  // Run the query
  const [rows] = await bq.query({
    query,
    params,
  });

  // Get total count for pagination (separate query)
  let countQuery = `
    SELECT COUNT(*) as total
    FROM \`xcc-473.police_logs.arrest_logs\`
  `;
  const countParams: any = {};
  const countConditions: string[] = [];

  if (search) {
    countConditions.push(
      `(first_name LIKE @search OR last_name LIKE @search OR charges LIKE @search)`
    );
    countParams.search = `%${search}%`;
  }

  if (cityTownFilter) {
    countConditions.push(`UPPER(city_town) LIKE CONCAT(UPPER(@cityTown), '%')`);
    countParams.cityTown = cityTownFilter;
  }

  if (dateFrom) {
    countConditions.push(`arrest_date >= @dateFrom`);
    countParams.dateFrom = dateFrom;
  }

  if (dateTo) {
    countConditions.push(`arrest_date <= @dateTo`);
    countParams.dateTo = dateTo;
  }

  if (countConditions.length > 0) {
    countQuery += ` WHERE ${countConditions.join(" AND ")}`;
  }

  const [countRows] = await bq.query({
    query: countQuery,
    params: countParams,
  });

  const total = Number((countRows[0] as any).total);

  // Serialize BigQuery rows to plain objects for Client Components
  const serializedArrests = rows.map((row: any) =>
    serializeBigQueryRow(row)
  ) as ArrestLog[];

  return {
    arrests: serializedArrests,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const city = searchParams.get("city");
    const town = searchParams.get("town");
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Create cache key from all parameters
    const cacheKey = `arrests-${page}-${limit}-${city || ""}-${
      town || ""
    }-${search}-${dateFrom || ""}-${dateTo || ""}`;

    // Cache the query results
    const cachedGetArrestsData = unstable_cache(
      async () =>
        getArrestsData(page, limit, city, town, search, dateFrom, dateTo),
      [cacheKey],
      {
        revalidate: 3600, // 1 hour
        tags: ["arrests"],
      }
    );

    const data = await cachedGetArrestsData();

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("BigQuery API Error:", error);
    console.error("Error stack:", error.stack);

    // Provide more helpful error messages
    let errorMessage = "Failed to fetch arrest logs";
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
