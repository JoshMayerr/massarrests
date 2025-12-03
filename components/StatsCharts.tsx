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
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
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
  dayOfWeekData: Array<{ day: string; count: number }>;
  ageDistribution: Array<{ ageRange: string; count: number }>;
  sexBreakdown: Array<{ sex: string; count: number }>;
  raceBreakdown: Array<{ race: string; count: number }>;
}

export default function StatsCharts({
  stats,
  topCharges,
  topCities,
  timelineData,
  dayOfWeekData,
  ageDistribution,
  sexBreakdown,
  raceBreakdown,
}: StatsChartsProps) {
  // Prepare charges data for the chart (limit to top 10 for readability)
  const chargesData = (topCharges || []).slice(0, 10).map((item) => ({
    charge:
      item.charge.length > 30
        ? item.charge.substring(0, 30) + "..."
        : item.charge,
    count: item.count,
  }));

  // Ensure we have valid data for top cities
  const citiesData = (topCities || [])
    .slice(0, 8)
    .filter((item) => item.city && item.count > 0);

  // Ensure we have valid data for day of week - ensure all 7 days are present
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayOfWeekMap = new Map(
    (dayOfWeekData || []).map((item) => [item.day, item.count])
  );
  const completeDayOfWeekData = dayNames.map((day) => ({
    day,
    count: dayOfWeekMap.get(day) || 0,
  }));

  // Colors for pie charts
  const COLORS = [
    "#DA291C",
    "#ED8B00",
    "#00843D",
    "#7C878E",
    "#003DA5",
    "#FFC72C",
  ];

  // Prepare sex breakdown for pie chart
  const sexData = sexBreakdown.map((item) => ({
    name: item.sex,
    value: item.count,
  }));

  // Prepare race breakdown for pie chart
  const raceData = raceBreakdown.map((item) => ({
    name: item.race,
    value: item.count,
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
          <div className="transit-data font-bold uppercase">THIS YEAR</div>
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
          {citiesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={citiesData} layout="horizontal">
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
          ) : (
            <div className="text-center py-8">
              <div className="transit-data font-bold text-black uppercase">
                NO DATA AVAILABLE
              </div>
            </div>
          )}
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
          {completeDayOfWeekData.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={completeDayOfWeekData} layout="horizontal">
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
                  dataKey="day"
                  type="category"
                  tick={{ fontSize: 12, fontWeight: "bold" }}
                  width={80}
                />
                <Bar
                  dataKey="count"
                  fill="#7C878E"
                  stroke="#000000"
                  strokeWidth={2}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8">
              <div className="transit-data font-bold text-black uppercase">
                NO DATA AVAILABLE
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Age Distribution */}
        <div className="transit-card border-l-4 border-l-teal-500">
          <h3 className="transit-section mb-4">AGE DISTRIBUTION</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageDistribution}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#000000"
                strokeWidth={2}
              />
              <XAxis
                dataKey="ageRange"
                tick={{ fontSize: 12, fontWeight: "bold" }}
              />
              <YAxis tick={{ fontSize: 12, fontWeight: "bold" }} />
              <Bar
                dataKey="count"
                fill="#14B8A6"
                stroke="#000000"
                strokeWidth={2}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sex Breakdown */}
        <div className="transit-card border-l-4 border-l-pink-500">
          <h3 className="transit-section mb-4">BY SEX</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={sexData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) =>
                  `${props.name}: ${(props.percent * 100).toFixed(0)}%`
                }
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                stroke="#000000"
                strokeWidth={2}
              >
                {sexData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Race Breakdown */}
        <div className="transit-card border-l-4 border-l-indigo-500">
          <h3 className="transit-section mb-4">BY RACE</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={raceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) =>
                  `${props.name}: ${(props.percent * 100).toFixed(0)}%`
                }
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                stroke="#000000"
                strokeWidth={2}
              >
                {raceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
