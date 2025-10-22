"use client";

import { ArrestLog } from "@/lib/mockData";
import { format, formatDistanceToNow } from "date-fns";
import { useState, useMemo } from "react";

interface ArrestLogSidebarClientProps {
  arrests: ArrestLog[];
}

const getIncidentTypeColor = (incidentType: string) => {
  const colors: Record<string, string> = {
    DUI: "bg-red-100 text-red-800 border-red-200",
    Assault: "bg-orange-100 text-orange-800 border-orange-200",
    Theft: "bg-blue-100 text-blue-800 border-blue-200",
    "Drug Possession": "bg-purple-100 text-purple-800 border-purple-200",
    Burglary: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Robbery: "bg-red-100 text-red-800 border-red-200",
    "Domestic Violence": "bg-pink-100 text-pink-800 border-pink-200",
    Warrant: "bg-gray-100 text-gray-800 border-gray-200",
    Fraud: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };
  return colors[incidentType] || "bg-gray-100 text-gray-800 border-gray-200";
};

export default function ArrestLogSidebarClient({
  arrests,
}: ArrestLogSidebarClientProps) {
  return (
    <div className="h-full border-r border-gray-300 flex flex-col">
      <div className="p-4 border-b border-gray-300 flex-shrink-0">
        <h2 className="font-bold text-lg uppercase">
          Recent Logs ({arrests.length})
        </h2>

        {/* Last Updated Tag */}
        <div className="mt-2">
          <div className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1.5"></div>
            <span className="transit-data text-[10px] text-gray-600">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto sidebar-scrollbar">
        <div className="divide-y divide-transit-border">
          {arrests.map((arrest) => {
            const arrestDate = new Date(arrest.date);
            const relativeTime = formatDistanceToNow(arrestDate, {
              addSuffix: true,
            });

            return (
              <div
                key={arrest.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Header with time and incident type badge */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="transit-data text-xs text-gray-500">
                      {format(arrestDate, "MMM dd, yyyy")}
                    </span>
                    <span className="transit-data text-xs text-gray-400">
                      {relativeTime}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded border ${getIncidentTypeColor(
                      arrest.incidentType
                    )}`}
                  >
                    {arrest.incidentType}
                  </span>
                </div>

                {/* Location */}
                <div className="mb-2">
                  <div className="transit-data font-medium text-sm">
                    {arrest.city}
                  </div>
                  <div className="transit-data text-xs text-gray-500">
                    {arrest.county} County
                  </div>
                </div>

                {/* Description */}
                <div className="mb-2">
                  <p className="transit-data text-xs text-gray-700 leading-relaxed">
                    {arrest.description}
                  </p>
                </div>

                {/* Charges */}
                <div className="flex flex-wrap gap-1">
                  {arrest.charges.slice(0, 2).map((charge, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200"
                    >
                      {charge}
                    </span>
                  ))}
                  {arrest.charges.length > 2 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded border border-gray-200">
                      +{arrest.charges.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
