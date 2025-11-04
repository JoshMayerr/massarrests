import {
  ArrestLog,
  mockArrests,
  getStats,
  getIncidentTypeBreakdown,
  getTopCities,
  getTimelineData,
} from "./mockData";

export interface Filters {
  town?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface AppData {
  arrests: ArrestLog[];
  stats: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  incidentBreakdown: Record<string, number>;
  topCities: Array<{ city: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
}

function applyFilters(arrests: ArrestLog[], filters: Filters): ArrestLog[] {
  let filtered = [...arrests];

  // Filter by town
  if (filters.town) {
    filtered = filtered.filter((arrest) =>
      arrest.city.toLowerCase().includes(filters.town!.toLowerCase())
    );
  }

  // Filter by date range
  if (filters.dateFrom) {
    const dateFrom = new Date(filters.dateFrom);
    filtered = filtered.filter((arrest) => {
      const arrestDate = new Date(arrest.date);
      return arrestDate >= dateFrom;
    });
  }

  if (filters.dateTo) {
    const dateTo = new Date(filters.dateTo);
    // Set to end of day for inclusive filtering
    dateTo.setHours(23, 59, 59, 999);
    filtered = filtered.filter((arrest) => {
      const arrestDate = new Date(arrest.date);
      return arrestDate <= dateTo;
    });
  }

  return filtered;
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === "production"
      ? ""
      : "http://localhost:3000")
  );
}

async function fetchArrests(): Promise<ArrestLog[]> {
  const baseUrl = getBaseUrl();
  console.log("Fetching arrests from:", `${baseUrl}/api/arrests?limit=100`);
  const response = await fetch(`${baseUrl}/api/arrests?limit=100`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch arrests data");
  }

  const data = await response.json();
  return data.arrests;
}

async function fetchStats(): Promise<{
  stats: { total: number; thisWeek: number; thisMonth: number };
  incidentBreakdown: Record<string, number>;
  topCities: Array<{ city: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
}> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/arrests/stats`;
  console.log("Fetching stats from:", url);

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log("Stats response status:", response.status, response.statusText);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stats data: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log("Stats data received:", data);
  return data;
}

export async function getAppData(filters: Filters = {}): Promise<AppData> {
  try {
    // Apply filters to arrests
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

    console.log("Using direct mock data functions with filters:", {
      filters,
      arrestsCount: filteredArrests.length,
      stats,
      hasIncidentBreakdown: Object.keys(incidentBreakdown).length > 0,
      hasTopCities: topCities.length > 0,
      hasTimelineData: timelineData.length > 0,
    });

    return {
      arrests: filteredArrests,
      stats,
      incidentBreakdown,
      topCities,
      timelineData,
    };
  } catch (error) {
    console.error("Error getting app data:", error);
    // Return empty data as fallback
    return {
      arrests: [],
      stats: { total: 0, thisWeek: 0, thisMonth: 0 },
      incidentBreakdown: {},
      topCities: [],
      timelineData: [],
    };
  }
}
