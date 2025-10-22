import { NextResponse } from "next/server";
import { mockArrests } from "@/lib/mockData";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const city = searchParams.get("city");
  const incidentType = searchParams.get("incidentType");

  let filteredArrests = [...mockArrests];

  // Apply filters
  if (city) {
    filteredArrests = filteredArrests.filter((arrest) =>
      arrest.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  if (incidentType) {
    filteredArrests = filteredArrests.filter((arrest) =>
      arrest.incidentType.toLowerCase().includes(incidentType.toLowerCase())
    );
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
