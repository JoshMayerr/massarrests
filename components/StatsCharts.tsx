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
  topCharges: Array<{ charge: string; count: number }>;
  topCities: Array<{ city: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
}

export default function StatsCharts({
  stats,
  topCharges,
  topCities,
  timelineData,
}: StatsChartsProps) {
  // Prepare charges data for the chart (limit to top 10 for readability)
  const chargesData = topCharges.slice(0, 10).map((item) => ({
    charge: item.charge.length > 30 ? item.charge.substring(0, 30) + "..." : item.charge,
    count: item.count,
  }));

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="transit-card text-center border-l-4 border-l-red-500">
          <div className="font-black text-5xl text-black">{stats.total}</div>
          <div className="transit-data font-bold uppercase">TOTAL ARRESTS</div>
        </div>
        <div className="transit-card text-center border-l-4 border-l-orange-500">
          <div className="font-black text-5xl text-black">{stats.thisWeek}</div>
          <div className="transit-data font-bold uppercase">THIS WEEK</div>
        </div>
        <div className="transit-card text-center border-l-4 border-l-green-500">
          <div className="font-black text-5xl text-black">
            {stats.thisMonth}
          </div>
          <div className="transit-data font-bold uppercase">THIS MONTH</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Timeline Chart */}
        <div className="transit-card border-l-4 border-l-blue-500">
          <h3 className="transit-section mb-4">TIMELINE</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timelineData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#000000"
                strokeWidth={2}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fontWeight: "bold" }}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis tick={{ fontSize: 12, fontWeight: "bold" }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#DA291C"
                strokeWidth={3}
                dot={{ fill: "#DA291C", strokeWidth: 3, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Cities */}
        <div className="transit-card border-l-4 border-l-orange-500">
          <h3 className="transit-section mb-4">TOP CITIES</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topCities.slice(0, 8)} layout="horizontal">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#000000"
                strokeWidth={2}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fontWeight: "bold" }}
              />
              <YAxis
                dataKey="city"
                type="category"
                tick={{ fontSize: 12, fontWeight: "bold" }}
                width={80}
              />
              <Bar
                dataKey="count"
                fill="#ED8B00"
                stroke="#000000"
                strokeWidth={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Charges */}
        <div className="transit-card border-l-4 border-l-green-500">
          <h3 className="transit-section mb-4">TOP CHARGES</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chargesData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#000000"
                strokeWidth={2}
              />
              <XAxis
                dataKey="charge"
                tick={{ fontSize: 12, fontWeight: "bold" }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12, fontWeight: "bold" }} />
              <Bar
                dataKey="count"
                fill="#00843D"
                stroke="#000000"
                strokeWidth={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Day of Week */}
        <div className="transit-card border-l-4 border-l-silver-500">
          <h3 className="transit-section mb-4">BY DAY OF WEEK</h3>
          <div className="text-center py-8">
            <div className="transit-data font-bold text-black uppercase">
              COMING SOON
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
