import { NextResponse } from "next/server";
import {
  getStats,
  getIncidentTypeBreakdown,
  getTopCities,
  getTimelineData,
} from "@/lib/mockData";

export async function GET() {
  const stats = getStats();
  const incidentBreakdown = getIncidentTypeBreakdown();
  const topCities = getTopCities();
  const timelineData = getTimelineData();

  return NextResponse.json({
    stats,
    incidentBreakdown,
    topCities,
    timelineData,
  });
}
