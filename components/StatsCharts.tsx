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
  Label,
} from "recharts";

interface StatsChartsProps {
  stats: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    totalCharges: number;
    averageAge: number;
    avgChargesPerArrest: number;
  };
  topCharges: Array<{ charge: string; count: number }>;
  timelineData: Array<{ date: string; count: number }>;
  ageDistribution: Array<{ ageRange: string; count: number }>;
  sexBreakdown: Array<{ sex: string; count: number }>;
  raceBreakdown: Array<{ race: string; count: number }>;
  chargeCategories?: Array<{ category: string; count: number }>;
  chargeTrends?: Array<{ date: string; category: string; count: number }>;
  chargesByAge?: Array<{ ageRange: string; charge: string; count: number }>;
  chargesByRace?: Array<{ race: string; charge: string; count: number }>;
  chargesBySex?: Array<{ sex: string; charge: string; count: number }>;
}

export default function StatsCharts({
  stats,
  topCharges,
  timelineData,
  ageDistribution,
  sexBreakdown,
  raceBreakdown,
  chargeCategories = [],
  chargeTrends = [],
  chargesByAge = [],
  chargesByRace = [],
  chargesBySex = [],
}: StatsChartsProps) {
  // Prepare charges data for the chart (limit to top 10 for readability)
  const chargesData = (topCharges || []).slice(0, 10).map((item) => ({
    charge:
      item.charge.length > 30
        ? item.charge.substring(0, 30) + "..."
        : item.charge,
    count: item.count,
  }));

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

  // Format number with commas
  const formatNumber = (value: number) => value.toLocaleString();

  // Truncate charge names for x-axis labels
  const truncateCharge = (charge: string, maxLength: number = 35) => {
    if (charge.length <= maxLength) return charge;
    return charge.substring(0, maxLength - 3) + "...";
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border border-gray-300 rounded text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {stats.total.toLocaleString()}
          </div>
          <div className="text-sm font-semibold text-gray-600 uppercase">
            Total Arrests
          </div>
        </div>
        <div className="p-4 border border-gray-300 rounded text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {stats.totalCharges.toLocaleString()}
          </div>
          <div className="text-sm font-semibold text-gray-600 uppercase">
            Total Charges
          </div>
        </div>
        <div className="p-4 border border-gray-300 rounded text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {stats.averageAge.toFixed(1)}
          </div>
          <div className="text-sm font-semibold text-gray-600 uppercase">
            Average Age
          </div>
        </div>
        <div className="p-4 border border-gray-300 rounded text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {stats.avgChargesPerArrest.toFixed(1)}
          </div>
          <div className="text-sm font-semibold text-gray-600 uppercase">
            Avg Charges per Arrest
          </div>
        </div>
      </div>

      {/* Charts - Full Width */}
      <div className="space-y-8">
        {/* Timeline Chart */}
        <div className="p-4 border border-gray-300 rounded">
          <h3 className="text-lg font-semibold mb-4">Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={timelineData}
              margin={{ top: 10, right: 20, bottom: 50, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  if (timelineData.length > 20) {
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      year: timelineData.length > 50 ? "2-digit" : undefined,
                    });
                  }
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
                interval={
                  timelineData.length > 20
                    ? Math.floor(timelineData.length / 10)
                    : 0
                }
              >
                <Label
                  value="Date"
                  position="insideBottom"
                  offset={-5}
                  style={{ textAnchor: "middle" }}
                />
              </XAxis>
              <YAxis tickFormatter={formatNumber}>
                <Label
                  value="Number of Arrests"
                  angle={-90}
                  position="insideLeft"
                  style={{ textAnchor: "middle" }}
                />
              </YAxis>
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Charges */}
        <div className="p-4 border border-gray-300 rounded">
          <h3 className="text-lg font-semibold mb-4">Top Charges</h3>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart
              data={chargesData}
              margin={{ top: 10, right: 20, bottom: 110, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="charge"
                angle={-45}
                textAnchor="end"
                height={90}
                tick={{ fontSize: 11 }}
                tickFormatter={(charge: string) => truncateCharge(charge, 45)}
              >
                <Label
                  value="Charge Type"
                  position="insideBottom"
                  offset={-5}
                  style={{ textAnchor: "middle" }}
                />
              </XAxis>
              <YAxis tickFormatter={formatNumber}>
                <Label
                  value="Number of Arrests"
                  angle={-90}
                  position="insideLeft"
                  style={{ textAnchor: "middle" }}
                />
              </YAxis>
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Additional Charts */}
        <div className="space-y-8">
          {/* Age Distribution */}
          <div className="p-4 border border-gray-300 rounded">
            <h3 className="text-lg font-semibold mb-4">Age Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={ageDistribution}
                margin={{ top: 10, right: 20, bottom: 50, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ageRange">
                  <Label
                    value="Age Range"
                    position="insideBottom"
                    offset={-5}
                    style={{ textAnchor: "middle" }}
                  />
                </XAxis>
                <YAxis tickFormatter={formatNumber}>
                  <Label
                    value="Number of Arrests"
                    angle={-90}
                    position="insideLeft"
                    style={{ textAnchor: "middle" }}
                  />
                </YAxis>
                <Tooltip />
                <Bar dataKey="count" fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Sex Breakdown */}
          <div className="p-4 border border-gray-300 rounded">
            <h3 className="text-lg font-semibold mb-4">By Sex</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sexData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) =>
                    `${props.name}: ${(props.percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  dataKey="value"
                >
                  {sexData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#3b82f6" : "#ec4899"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Race Breakdown */}
          <div className="p-4 border border-gray-300 rounded">
            <h3 className="text-lg font-semibold mb-4">By Race</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={raceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) =>
                    `${props.name}: ${(props.percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  dataKey="value"
                >
                  {raceData.map((entry, index) => {
                    const colors = [
                      "#3b82f6",
                      "#10b981",
                      "#f59e0b",
                      "#ef4444",
                      "#8b5cf6",
                      "#ec4899",
                      "#14b8a6",
                    ];
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    );
                  })}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charge-Based Charts */}
        {chargeCategories.length > 0 && (
          <div className="space-y-8">
            {/* Charge Categories */}
            <div className="p-4 border border-gray-300 rounded">
              <h3 className="text-lg font-semibold mb-4">Charge Categories</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chargeCategories}
                  margin={{ top: 10, right: 20, bottom: 50, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category">
                    <Label
                      value="Category"
                      position="insideBottom"
                      offset={-5}
                      style={{ textAnchor: "middle" }}
                    />
                  </XAxis>
                  <YAxis tickFormatter={formatNumber}>
                    <Label
                      value="Number of Charges"
                      angle={-90}
                      position="insideLeft"
                      style={{ textAnchor: "middle" }}
                    />
                  </YAxis>
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Charge Trends Over Time */}
            {chargeTrends.length > 0 &&
              (() => {
                // Group charge trends by date and category
                const trendsByDate: Record<string, Record<string, number>> = {};
                const categories = new Set<string>();

                chargeTrends.forEach((item) => {
                  if (!trendsByDate[item.date]) {
                    trendsByDate[item.date] = {};
                  }
                  trendsByDate[item.date][item.category] = item.count;
                  categories.add(item.category);
                });

                const chartData = Object.entries(trendsByDate)
                  .map(([date, categories]) => ({
                    date,
                    ...categories,
                  }))
                  .sort(
                    (a, b) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  );

                const categoryColors: Record<string, string> = {
                  Assault: "#ef4444",
                  Theft: "#f59e0b",
                  Drug: "#10b981",
                  Traffic: "#6b7280",
                  Warrant: "#3b82f6",
                  Weapon: "#eab308",
                  "Disorderly Conduct": "#8b5cf6",
                  "Domestic Violence": "#ec4899",
                  Fraud: "#14b8a6",
                  Vandalism: "#f97316",
                  Other: "#64748b",
                };

                return (
                  <div className="p-4 border border-gray-300 rounded">
                    <h3 className="text-lg font-semibold mb-4">
                      Charge Trends Over Time
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 20, bottom: 50, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString("en-US", {
                              month: "short",
                              day:
                                chartData.length > 20 ? undefined : "numeric",
                            });
                          }}
                          interval={
                            chartData.length > 20
                              ? Math.floor(chartData.length / 10)
                              : 0
                          }
                        >
                          <Label
                            value="Date"
                            position="insideBottom"
                            offset={-5}
                            style={{ textAnchor: "middle" }}
                          />
                        </XAxis>
                        <YAxis tickFormatter={formatNumber}>
                          <Label
                            value="Number of Charges"
                            angle={-90}
                            position="insideLeft"
                            style={{ textAnchor: "middle" }}
                          />
                        </YAxis>
                        <Tooltip />
                        <Legend />
                        {Array.from(categories)
                          .slice(0, 6)
                          .map((category) => (
                            <Line
                              key={category}
                              type="monotone"
                              dataKey={category}
                              stroke={categoryColors[category] || "#8884d8"}
                              strokeWidth={2}
                              dot={false}
                              name={category}
                            />
                          ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                );
              })()}
          </div>
        )}

        {/* Charges by Demographics */}
        {(chargesByAge.length > 0 ||
          chargesByRace.length > 0 ||
          chargesBySex.length > 0) && (
          <div className="space-y-8">
            {/* Charges by Age */}
            {chargesByAge.length > 0 && (
              <div className="p-4 border border-gray-300 rounded">
                <h3 className="text-lg font-semibold mb-4">
                  Top Charges by Age
                </h3>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart
                    data={chargesByAge.slice(0, 15)}
                    margin={{ top: 10, right: 20, bottom: 110, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="charge"
                      angle={-45}
                      textAnchor="end"
                      height={90}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(charge: string) =>
                        truncateCharge(charge, 45)
                      }
                    >
                      <Label
                        value="Charge"
                        position="insideBottom"
                        offset={-5}
                        style={{ textAnchor: "middle" }}
                      />
                    </XAxis>
                    <YAxis tickFormatter={formatNumber}>
                      <Label
                        value="Count"
                        angle={-90}
                        position="insideLeft"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>
                    <Tooltip />
                    <Bar dataKey="count">
                      {chargesByAge.slice(0, 15).map((entry, index) => {
                        const ageColors: Record<string, string> = {
                          "0-17": "#ef4444",
                          "18-24": "#f59e0b",
                          "25-34": "#eab308",
                          "35-44": "#10b981",
                          "45-54": "#3b82f6",
                          "55-64": "#8b5cf6",
                          "65+": "#ec4899",
                        };
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={ageColors[entry.ageRange] || "#8884d8"}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Charges by Race */}
            {chargesByRace.length > 0 && (
              <div className="p-4 border border-gray-300 rounded">
                <h3 className="text-lg font-semibold mb-4">
                  Top Charges by Race
                </h3>
                <ResponsiveContainer width="100%" height={600}>
                  <BarChart
                    data={chargesByRace.slice(0, 15)}
                    margin={{ top: 10, right: 20, bottom: 110, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="charge"
                      angle={-45}
                      textAnchor="end"
                      height={90}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(charge: string) =>
                        truncateCharge(charge, 45)
                      }
                    >
                      <Label
                        value="Charge"
                        position="insideBottom"
                        offset={-5}
                        style={{ textAnchor: "middle" }}
                      />
                    </XAxis>
                    <YAxis tickFormatter={formatNumber}>
                      <Label
                        value="Count"
                        angle={-90}
                        position="insideLeft"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>
                    <Tooltip />
                    <Bar dataKey="count">
                      {chargesByRace.slice(0, 15).map((entry, index) => {
                        const raceColors: Record<string, string> = {
                          WHITE: "#3b82f6",
                          BLACK: "#1f2937",
                          HISPANIC: "#f59e0b",
                          ASIAN: "#10b981",
                          "NATIVE AMERICAN": "#8b5cf6",
                          OTHER: "#6b7280",
                        };
                        const raceKey = entry.race.toUpperCase();
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={raceColors[raceKey] || "#8884d8"}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Charges by Sex */}
            {chargesBySex.length > 0 && (
              <div className="p-4 border border-gray-300 rounded">
                <h3 className="text-lg font-semibold mb-4">
                  Top Charges by Sex
                </h3>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart
                    data={chargesBySex.slice(0, 15)}
                    margin={{ top: 10, right: 20, bottom: 110, left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="charge"
                      angle={-45}
                      textAnchor="end"
                      height={90}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(charge: string) =>
                        truncateCharge(charge, 45)
                      }
                    >
                      <Label
                        value="Charge"
                        position="insideBottom"
                        offset={-5}
                        style={{ textAnchor: "middle" }}
                      />
                    </XAxis>
                    <YAxis tickFormatter={formatNumber}>
                      <Label
                        value="Count"
                        angle={-90}
                        position="insideLeft"
                        style={{ textAnchor: "middle" }}
                      />
                    </YAxis>
                    <Tooltip />
                    <Bar dataKey="count">
                      {chargesBySex.slice(0, 15).map((entry, index) => {
                        const sexColors: Record<string, string> = {
                          M: "#3b82f6",
                          F: "#ec4899",
                          MALE: "#3b82f6",
                          FEMALE: "#ec4899",
                        };
                        const sexKey = entry.sex.toUpperCase();
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={sexColors[sexKey] || "#8884d8"}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
