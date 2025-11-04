import { NextResponse } from "next/server";
import { mockArrests, ArrestLog } from "@/lib/mockData";

function applyFilters(arrests: ArrestLog[], filters: {
  town?: string;
  dateFrom?: string;
  dateTo?: string;
}): ArrestLog[] {
  let filtered = [...arrests];

  if (filters.town) {
    filtered = filtered.filter((arrest) =>
      arrest.city.toLowerCase().includes(filters.town!.toLowerCase())
    );
  }

  if (filters.dateFrom) {
    const dateFrom = new Date(filters.dateFrom);
    filtered = filtered.filter((arrest) => {
      const arrestDate = new Date(arrest.date);
      return arrestDate >= dateFrom;
    });
  }

  if (filters.dateTo) {
    const dateTo = new Date(filters.dateTo);
    dateTo.setHours(23, 59, 59, 999);
    filtered = filtered.filter((arrest) => {
      const arrestDate = new Date(arrest.date);
      return arrestDate <= dateTo;
    });
  }

  return filtered;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const town = searchParams.get("town");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");

  const filters = {
    town: town || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  };

  // Apply filters
  const filteredArrests = applyFilters(mockArrests, filters);

  // Calculate stats from filtered data
  const total = filteredArrests.length;
  const thisWeek = filteredArrests.filter((arrest) => {
    const arrestDate = new Date(arrest.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return arrestDate >= weekAgo;
  }).length;

  const thisMonth = filteredArrests.filter((arrest) => {
    const arrestDate = new Date(arrest.date);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return arrestDate >= monthAgo;
  }).length;

  const stats = { total, thisWeek, thisMonth };

  // Calculate incident breakdown from filtered data
  const incidentBreakdown: Record<string, number> = {};
  filteredArrests.forEach((arrest) => {
    incidentBreakdown[arrest.incidentType] =
      (incidentBreakdown[arrest.incidentType] || 0) + 1;
  });

  // Calculate top cities from filtered data
  const cityCounts: Record<string, number> = {};
  filteredArrests.forEach((arrest) => {
    cityCounts[arrest.city] = (cityCounts[arrest.city] || 0) + 1;
  });

  const topCities = Object.entries(cityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }));

  // Calculate timeline data from filtered data
  const timeline: Record<string, number> = {};
  filteredArrests.forEach((arrest) => {
    const date = new Date(arrest.date).toISOString().split("T")[0];
    timeline[date] = (timeline[date] || 0) + 1;
  });

  const timelineData = Object.entries(timeline)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return NextResponse.json({
    stats,
    incidentBreakdown,
    topCities,
    timelineData,
  });
}
