import { ArrestLog } from "./types";

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
  topCharges: Array<{ charge: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
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

async function fetchArrests(filters: Filters = {}): Promise<ArrestLog[]> {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();

  params.append("limit", "100");
  params.append("page", "1");

  if (filters.town) {
    params.append("town", filters.town);
  }
  if (filters.dateFrom) {
    params.append("dateFrom", filters.dateFrom);
  }
  if (filters.dateTo) {
    params.append("dateTo", filters.dateTo);
  }

  const url = `${baseUrl}/api/arrests?${params.toString()}`;
  console.log("Fetching arrests from:", url);

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = errorText;
    }
    console.error("Failed to fetch arrests data:", {
      status: response.status,
      statusText: response.statusText,
      url,
      error: errorDetails,
    });
    throw new Error(
      `Failed to fetch arrests data: ${response.status} ${
        response.statusText
      }. ${errorDetails?.error || errorDetails?.details || errorText}`
    );
  }

  const data = await response.json();
  return data.arrests || [];
}

async function fetchStats(filters: Filters = {}): Promise<{
  stats: { total: number; thisWeek: number; thisMonth: number };
  topCharges: Array<{ charge: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
}> {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();

  if (filters.town) {
    params.append("town", filters.town);
  }
  if (filters.dateFrom) {
    params.append("dateFrom", filters.dateFrom);
  }
  if (filters.dateTo) {
    params.append("dateTo", filters.dateTo);
  }

  const url = `${baseUrl}/api/arrests/stats${
    params.toString() ? `?${params.toString()}` : ""
  }`;
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

export async function fetchHeatmapData(
  filters: Filters = {}
): Promise<Array<{ city: string; count: number }>> {
  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();

  if (filters.town) {
    params.append("town", filters.town);
  }
  if (filters.dateFrom) {
    params.append("dateFrom", filters.dateFrom);
  }
  if (filters.dateTo) {
    params.append("dateTo", filters.dateTo);
  }

  const url = `${baseUrl}/api/arrests/heatmap${
    params.toString() ? `?${params.toString()}` : ""
  }`;
  console.log("Fetching heatmap data from:", url);

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = errorText;
    }
    console.error("Failed to fetch heatmap data:", {
      status: response.status,
      statusText: response.statusText,
      url,
      error: errorDetails,
    });
    throw new Error(
      `Failed to fetch heatmap data: ${response.status} ${
        response.statusText
      }. ${errorDetails?.error || errorDetails?.details || errorText}`
    );
  }

  const data = await response.json();
  return data.cityCounts || [];
}

export async function getAppData(filters: Filters = {}): Promise<AppData> {
  try {
    // Fetch arrests and stats in parallel
    const [arrests, statsData] = await Promise.all([
      fetchArrests(filters),
      fetchStats(filters),
    ]);

    console.log("Fetched app data:", {
      filters,
      arrestsCount: arrests.length,
      stats: statsData.stats,
      topChargesCount: statsData.topCharges.length,
      topCitiesCount: statsData.topCities.length,
      timelineDataCount: statsData.timelineData.length,
    });

    return {
      arrests,
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
      stats: { total: 0, thisWeek: 0, thisMonth: 0 },
      topCharges: [],
      topCities: [],
      timelineData: [],
    };
  }
}
