"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface StatsChartsProps {
  stats: {
    total: number;
    thisWeek: number;
    thisMonth: number;
  };
  incidentBreakdown: Record<string, number>;
  topCities: Array<{ city: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
}

export default function StatsCharts({
  stats,
  incidentBreakdown,
  topCities,
  timelineData,
}: StatsChartsProps) {
  const incidentData = Object.entries(incidentBreakdown).map(
    ([type, count]) => ({
      type,
      count,
    })
  );

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="transit-card text-center">
          <div className="font-extrabold text-5xl">{stats.total}</div>
          <div className="font-medium text-sm">Total Arrests</div>
        </div>
        <div className="transit-card text-center">
          <div className="font-extrabold text-5xl">{stats.thisWeek}</div>
          <div className="font-medium text-sm">This Week</div>
        </div>
        <div className="transit-card text-center">
          <div className="font-extrabold text-5xl">{stats.thisMonth}</div>
          <div className="font-medium text-sm">This Month</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Timeline Chart */}
        <div className="transit-card">
          <h3 className="font-bold text-lg uppercase mb-4">Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#DC143C"
                strokeWidth={2}
                dot={{ fill: "#DC143C", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Cities */}
        <div className="transit-card">
          <h3 className="font-bold text-lg uppercase mb-4">Top Cities</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topCities.slice(0, 8)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="city"
                type="category"
                tick={{ fontSize: 12 }}
                width={80}
              />
              <Bar dataKey="count" fill="#DC143C" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Incident Types */}
        <div className="transit-card">
          <h3 className="font-bold text-lg uppercase mb-4">Incident Types</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incidentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Bar dataKey="count" fill="#DC143C" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Day of Week */}
        <div className="transit-card">
          <h3 className="transit-section mb-4">By Day of Week</h3>
          <div className="text-center py-8">
            <div className="transit-data text-gray-500">Coming Soon</div>
          </div>
        </div>
      </div>
    </div>
  );
}
