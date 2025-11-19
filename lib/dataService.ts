// dataService.ts
import { ArrestLog } from "@/lib/mockData";
import { formatISO, subDays } from "date-fns";

export interface Filters {
  town?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AppData {
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

const normalizeIncidentType = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("dui")) return "DUI";
  if (t.includes("assault")) return "Assault";
  if (t.includes("theft") || t.includes("larceny")) return "Theft";
  if (t.includes("drug")) return "Drug Possession";
  if (t.includes("burglary")) return "Burglary";
  if (t.includes("robbery")) return "Robbery";
  if (t.includes("domestic")) return "Domestic Violence";
  if (t.includes("warrant")) return "Warrant";
  if (t.includes("fraud")) return "Fraud";
  return type;
};

function getBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NODE_ENV === "production"
      ? ""
      : "http://localhost:3001");
  console.log("Base URL:", url);
  return url;
}

export async function getAppData(filters: Filters = {}): Promise<AppData> {

  try {
    const baseUrl = getBaseUrl();
    const url = new URL(`${baseUrl}/api/arrests`);
    
    if (filters.town) url.searchParams.append("town", filters.town);
    if (filters.dateFrom) url.searchParams.append("dateFrom", filters.dateFrom);
    if (filters.dateTo) url.searchParams.append("dateTo", filters.dateTo);


    const res = await fetch(url.toString(), { cache: "no-store" });


    if (!res.ok) {
      const errorText = await res.text();
      console.error("Fetch failed:", errorText);
      throw new Error(`Failed to fetch arrests: ${res.statusText}`);
    }

    const data: { arrests: ArrestLog[] } = await res.json();
    console.log(data)
    const arrests = data.arrests;
    console.log("Fetched arrests count:", arrests.length);

    const now = new Date();
    const weekAgo = subDays(now, 7);
    const monthAgo = subDays(now, 30);
    const currentYear = now.getFullYear();
    console.log("this is arrests")
    console.log(arrests.length)
    const stats = {
      total: arrests.length,
      thisWeek: arrests.filter(a => new Date(a.date) >= weekAgo).length,
      thisMonth: arrests.filter(a => new Date(a.date).getFullYear() === currentYear).length,
    };
    console.log("Stats calculated:", stats);


    const incidentBreakdown: Record<string, number> = {};
    arrests.forEach(a => {
      const type = normalizeIncidentType(a.incidentType);
      incidentBreakdown[type] = (incidentBreakdown[type] || 0) + 1;
    });
    console.log("Incident breakdown:", incidentBreakdown);

    const cityCounts: Record<string, number> = {};
    arrests.forEach(a => {
      cityCounts[a.city] = (cityCounts[a.city] || 0) + 1;
    });
    const topCities = Object.entries(cityCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));
    console.log("Top cities:", topCities);

    const timelineCounts: Record<string, number> = {};
    arrests.forEach(a => {
      const dateStr = formatISO(new Date(a.date), { representation: "date" });
      timelineCounts[dateStr] = (timelineCounts[dateStr] || 0) + 1;
    });
    const timelineData = Object.entries(timelineCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));


    return { arrests, stats, incidentBreakdown, topCities, timelineData };
  } catch (error) {
    console.error("Error fetching app data:", error);
    return {
      arrests: [],
      stats: { total: 0, thisWeek: 0, thisMonth: 0 },
      incidentBreakdown: {},
      topCities: [],
      timelineData: [],
    };
  }
}
