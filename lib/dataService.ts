import { ArrestLog } from "./mockData";

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
  const response = await fetch(`${baseUrl}/api/arrests/stats`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch stats data");
  }

  return await response.json();
}

export async function getAppData(): Promise<AppData> {
  try {
    const [arrests, statsData] = await Promise.all([
      fetchArrests(),
      fetchStats(),
    ]);

    return {
      arrests,
      stats: statsData.stats,
      incidentBreakdown: statsData.incidentBreakdown,
      topCities: statsData.topCities,
      timelineData: statsData.timelineData,
    };
  } catch (error) {
    console.error("Error fetching app data:", error);
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
