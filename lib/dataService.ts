import {
  ArrestLog,
  mockArrests,
  getStats,
  getIncidentTypeBreakdown,
  getTopCities,
  getTimelineData,
} from "./mockData";

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

export async function getAppData(): Promise<AppData> {
  try {
    // Use direct function calls instead of HTTP requests to avoid server-to-server issues
    const arrests = mockArrests;
    const stats = getStats();
    const incidentBreakdown = getIncidentTypeBreakdown();
    const topCities = getTopCities();
    const timelineData = getTimelineData();

    console.log("Using direct mock data functions:", {
      arrestsCount: arrests.length,
      stats,
      hasIncidentBreakdown: Object.keys(incidentBreakdown).length > 0,
      hasTopCities: topCities.length > 0,
      hasTimelineData: timelineData.length > 0,
    });

    return {
      arrests,
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
