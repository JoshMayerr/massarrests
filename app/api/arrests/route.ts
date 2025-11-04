import { NextResponse } from "next/server";
import { mockArrests } from "@/lib/mockData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const city = searchParams.get("city");
  const town = searchParams.get("town");
  const incidentType = searchParams.get("incidentType");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  let filteredArrests = [...mockArrests];

  // Apply filters
  if (city) {
    filteredArrests = filteredArrests.filter((arrest) =>
      arrest.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  // Support both 'city' and 'town' params for backward compatibility
  if (town) {
    filteredArrests = filteredArrests.filter((arrest) =>
      arrest.city.toLowerCase().includes(town.toLowerCase())
    );
  }

  if (incidentType) {
    filteredArrests = filteredArrests.filter((arrest) =>
      arrest.incidentType.toLowerCase().includes(incidentType.toLowerCase())
    );
  }

  // Date filtering
  if (dateFrom) {
    const dateFromDate = new Date(dateFrom);
    filteredArrests = filteredArrests.filter((arrest) => {
      const arrestDate = new Date(arrest.date);
      return arrestDate >= dateFromDate;
    });
  }

  if (dateTo) {
    const dateToDate = new Date(dateTo);
    // Set to end of day for inclusive filtering
    dateToDate.setHours(23, 59, 59, 999);
    filteredArrests = filteredArrests.filter((arrest) => {
      const arrestDate = new Date(arrest.date);
      return arrestDate <= dateToDate;
    });
  }

  // Sort by date (most recent first)
  filteredArrests.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedArrests = filteredArrests.slice(startIndex, endIndex);

  return NextResponse.json({
    arrests: paginatedArrests,
    total: filteredArrests.length,
    page,
    limit,
    totalPages: Math.ceil(filteredArrests.length / limit),
  });
}
