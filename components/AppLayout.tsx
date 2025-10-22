"use client";

import { useEffect, useState } from "react";
import ArrestLogSidebarClient from "./ArrestLogSidebarClient";
import ArrestHeatmap from "./ArrestHeatmap";
import StatsCharts from "./StatsCharts";
import { ArrestLog } from "@/lib/mockData";

export default function AppLayout() {
  const [arrests, setArrests] = useState<ArrestLog[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    thisMonth: 0,
  });
  const [incidentBreakdown, setIncidentBreakdown] = useState<
    Record<string, number>
  >({});
  const [topCities, setTopCities] = useState<
    Array<{ city: string; count: number }>
  >([]);
  const [timelineData, setTimelineData] = useState<
    Array<{ date: string; count: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [arrestsRes, statsRes] = await Promise.all([
          fetch("/api/arrests"),
          fetch("/api/arrests/stats"),
        ]);

        const arrestsData = await arrestsRes.json();
        const statsData = await statsRes.json();

        setArrests(arrestsData.arrests);
        setStats(statsData.stats);
        setIncidentBreakdown(statsData.incidentBreakdown);
        setTopCities(statsData.topCities);
        setTimelineData(statsData.timelineData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="transit-data">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-black bg-white fixed top-0 left-0 right-0 z-20">
        <div className="px-6 py-4">
          <h1 className="transit-header">Massachusetts Police Logs</h1>
          <p className="transit-data text-sm text-gray-600">
            Last Updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Main Layout Container */}
      <div className="flex pt-20 min-h-screen">
        {/* Sidebar - Fixed width, full height, hidden on mobile */}
        <div className="w-80 flex-shrink-0 hidden lg:block">
          <ArrestLogSidebarClient arrests={arrests} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="p-4 lg:p-6 space-y-6 lg:space-y-8">
            {/* Heatmap */}
            <ArrestHeatmap arrests={arrests} />

            {/* Charts and Stats */}
            <StatsCharts
              stats={stats}
              incidentBreakdown={incidentBreakdown}
              topCities={topCities}
              timelineData={timelineData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
