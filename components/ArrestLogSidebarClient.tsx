"use client";

import { ArrestLog } from "@/lib/mockData";
import { format } from "date-fns";
import { Filters } from "@/lib/dataService";
import FilterButton from "./FilterButton";

interface ArrestLogSidebarClientProps {
  arrests: ArrestLog[];
  filters?: Filters;
}

const normalizeIncidentType = (type: string) => {
  type = type.toLowerCase();
  if (type.includes("dui")) return "DUI";
  if (type.includes("assault")) return "Assault";
  if (type.includes("theft") || type.includes("larceny") || type.includes("fraud"))
    return "Theft/Fraud";
  if (type.includes("drug")) return "Drug Possession";
  if (type.includes("burglary")) return "Burglary";
  if (type.includes("robbery")) return "Robbery";
  if (type.includes("domestic")) return "Domestic Violence";
  if (type.includes("warrant")) return "Warrant";
  if (type.includes("animal")) return "Animals";
  if (type.includes("escort") || type.includes("transport")) return "Escort/Transport";
  if (type.includes("suspicious")) return "Suspicious Activity";
  if (type.includes("911")) return "911 Call";
  if (type.includes("found") || type.includes("lost")) return "Property";
  return "Other";
};

const getIncidentTypeColor = (incidentType: string) => {
  const type = normalizeIncidentType(incidentType);
  const colors: Record<string, string> = {
    DUI: "bg-red-500 text-white",
    Assault: "bg-orange-400 text-white",
    "Theft/Fraud": "bg-blue-500 text-white",
    "Drug Possession": "bg-purple-500 text-white",
    Burglary: "bg-green-500 text-white",
    Robbery: "bg-red-600 text-white",
    "Domestic Violence": "bg-yellow-500 text-black",
    Warrant: "bg-gray-800 text-white",
    Animals: "bg-teal-400 text-black",
    "Escort/Transport": "bg-indigo-400 text-white",
    "Suspicious Activity": "bg-pink-400 text-white",
    "911 Call": "bg-rose-500 text-white",
    Property: "bg-lime-400 text-black",
    Other: "bg-gray-300 text-black",
  };
  return colors[type] || "bg-gray-300 text-black";
};

const getIncidentTypeBorderColor = (incidentType: string) => {
  const type = normalizeIncidentType(incidentType);
  const borderColors: Record<string, string> = {
    DUI: "border-l-red-500",
    Assault: "border-l-orange-400",
    "Theft/Fraud": "border-l-blue-500",
    "Drug Possession": "border-l-purple-500",
    Burglary: "border-l-green-500",
    Robbery: "border-l-red-600",
    "Domestic Violence": "border-l-yellow-500",
    Warrant: "border-l-gray-800",
    Animals: "border-l-teal-400",
    "Escort/Transport": "border-l-indigo-400",
    "Suspicious Activity": "border-l-pink-400",
    "911 Call": "border-l-rose-500",
    Property: "border-l-lime-400",
    Other: "border-l-gray-300",
  };
  return borderColors[type] || "border-l-gray-300";
};


export default function ArrestLogSidebarClient({
  arrests,
  filters,
}: ArrestLogSidebarClientProps) {
  return (
    <div className="h-full border-r-2 border-b-2 border-black flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b-2 border-black flex-shrink-0 p-4">
        <h2 className="text-xl font-extrabold uppercase text-black tracking-tight flex items-center justify-between">
          <span>ARREST LOGS</span>
          <span className="text-sm font-bold uppercase bg-black text-white px-2 py-1 rounded">
            {arrests.length}
          </span>
        </h2>
        <div className="mt-3">
          <FilterButton filters={filters}>
            <div className="w-full px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase hover:bg-gray-800 transition-colors text-sm text-center rounded">
              Filter
            </div>
          </FilterButton>
        </div>
      </div>

      {/* Arrest list */}
      <div className="flex-1 overflow-y-auto sidebar-scrollbar p-2">
        <div className="divide-y-2 divide-black">
          {arrests.map((arrest) => {
            const arrestDate = new Date(arrest.date);

            return (
              <div
                key={arrest.id}
                className={`p-3 mb-2 bg-white hover:bg-gray-50 transition-colors border-l-4 ${getIncidentTypeBorderColor(
                  arrest.incidentType
                )} shadow-sm rounded`}
              >
                {/* Incident type and date */}
                <div className="flex justify-between items-start mb-2 flex-wrap">
                  <div
                    className={`px-2 py-1 text-xs font-black uppercase border-2 border-black ${getIncidentTypeColor(
                      arrest.incidentType
                    )} break-words flex-1`}
                  >
                    {arrest.incidentType}
                  </div>
                  <span className="text-xs font-bold text-gray-700 ml-2 whitespace-nowrap self-start mt-0.5">
                    {format(arrestDate, "MMM dd, yyyy").toUpperCase()}
                  </span>
                </div>

                {/* Location */}
                <div className="mb-1">
                  <div className="text-xs font-bold uppercase text-black">
                    {arrest.city}
                  </div>
                  <div className="text-xs font-semibold text-gray-600 uppercase">
                    {arrest.county} COUNTY
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs font-normal text-black leading-snug mb-2 break-words">
                  {arrest.description}
                </p>

                {/* Charges */}
                <div className="flex flex-wrap gap-1">
                  {arrest.charges.slice(0, 2).map((charge, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-black text-white font-bold uppercase border border-black rounded"
                    >
                      {charge}
                    </span>
                  ))}
                  {arrest.charges.length > 2 && (
                    <span className="px-2 py-1 text-xs bg-gray-600 text-white font-bold uppercase border border-black rounded">
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
