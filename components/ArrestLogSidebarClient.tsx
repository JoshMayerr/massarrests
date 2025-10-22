"use client";

import { ArrestLog } from "@/lib/mockData";
import { format, formatDistanceToNow } from "date-fns";
import { useState, useMemo } from "react";

interface ArrestLogSidebarClientProps {
  arrests: ArrestLog[];
}

const getIncidentTypeColor = (incidentType: string) => {
  const colors: Record<string, string> = {
    DUI: "transit-red-bar",
    Assault: "transit-orange-bar",
    Theft: "transit-blue-bar",
    "Drug Possession": "transit-silver-bar",
    Burglary: "transit-green-bar",
    Robbery: "transit-red-bar",
    "Domestic Violence": "transit-orange-bar",
    Warrant: "bg-black text-white",
    Fraud: "transit-blue-bar",
  };
  return colors[incidentType] || "bg-black text-white";
};

const getIncidentTypeBorderColor = (incidentType: string) => {
  const borderColors: Record<string, string> = {
    DUI: "border-l-red-500",
    Assault: "border-l-orange-500",
    Theft: "border-l-blue-500",
    "Drug Possession": "border-l-gray-500",
    Burglary: "border-l-green-500",
    Robbery: "border-l-red-500",
    "Domestic Violence": "border-l-orange-500",
    Warrant: "border-l-black",
    Fraud: "border-l-blue-500",
  };
  return borderColors[incidentType] || "border-l-black";
};

export default function ArrestLogSidebarClient({
  arrests,
}: ArrestLogSidebarClientProps) {
  return (
    <div className="h-full border-r-2 border-b-2 border-black flex flex-col">
      <div className="bg-white border-b-2 border-black flex-shrink-0 p-4">
        <h2 className="text-xl font-extrabold uppercase text-black tracking-tight flex items-center justify-between">
          <span className="">RECENT ARREST LOGS</span>
          <span className="text-sm font-bold uppercase bg-black text-white px-2 py-1">
            {arrests.length}
          </span>
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto sidebar-scrollbar bg-white">
        <div className="divide-y-2 divide-black">
          {arrests.map((arrest) => {
            const arrestDate = new Date(arrest.date);
            const relativeTime = formatDistanceToNow(arrestDate, {
              addSuffix: true,
            });

            return (
              <div
                key={arrest.id}
                className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getIncidentTypeBorderColor(
                  arrest.incidentType
                )} hover:shadow-sm`}
              >
                {/* Header with incident type and date */}
                <div className="flex justify-between items-center mb-3">
                  <div
                    className={`px-3 py-1 text-xs font-black uppercase border-2 border-black ${getIncidentTypeColor(
                      arrest.incidentType
                    )}`}
                  >
                    {arrest.incidentType}
                  </div>
                  <span className="transit-data text-sm font-black text-black">
                    {format(arrestDate, "MMM dd, yyyy").toUpperCase()}
                  </span>
                </div>

                {/* Location */}
                <div className="mb-3">
                  <div className="transit-data font-black text-sm uppercase text-black">
                    {arrest.city}
                  </div>
                  <div className="transit-data text-xs font-bold text-gray-600 uppercase">
                    {arrest.county} COUNTY
                  </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <p className="transit-data text-xs font-semibold text-black leading-relaxed">
                    {arrest.description}
                  </p>
                </div>

                {/* Charges */}
                <div className="flex flex-wrap gap-1">
                  {arrest.charges.slice(0, 2).map((charge, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-black text-white font-bold uppercase border border-black"
                    >
                      {charge}
                    </span>
                  ))}
                  {arrest.charges.length > 2 && (
                    <span className="px-2 py-1 text-xs bg-gray-600 text-white font-bold uppercase border border-black">
                      +{arrest.charges.length - 2} MORE
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
