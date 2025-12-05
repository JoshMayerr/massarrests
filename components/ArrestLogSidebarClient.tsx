"use client";

import { useState, useEffect } from "react";
import { ArrestLog } from "@/lib/types";
import { format } from "date-fns";
import { Filters } from "@/lib/dataService";
import FilterButton from "./FilterButton";
import ArrestDetailDrawer from "./ArrestDetailDrawer";

interface ArrestLogSidebarClientProps {
  arrests?: ArrestLog[]; // Optional initial data
  total?: number; // Optional initial total count
  totalPages?: number; // Optional initial total pages
  initialPage?: number; // Optional initial page number
  filters?: Filters;
}

interface PaginationData {
  arrests: ArrestLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Parse charges string into array
const parseCharges = (charges: string): string[] => {
  if (!charges) return [];
  return charges
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
};

// Get color based on first charge (for visual consistency)
const getChargeColor = (charges: string[]) => {
  const firstCharge = charges[0]?.toLowerCase() || "";
  if (firstCharge.includes("oui") || firstCharge.includes("dui")) {
    return "transit-red-bar";
  }
  if (firstCharge.includes("assault") || firstCharge.includes("a&b")) {
    return "transit-orange-bar";
  }
  if (firstCharge.includes("theft") || firstCharge.includes("larceny")) {
    return "transit-blue-bar";
  }
  if (firstCharge.includes("drug") || firstCharge.includes("possession")) {
    return "transit-silver-bar";
  }
  if (firstCharge.includes("burglary")) {
    return "transit-green-bar";
  }
  if (firstCharge.includes("robbery")) {
    return "transit-red-bar";
  }
  if (firstCharge.includes("warrant")) {
    return "bg-black text-white";
  }
  return "bg-black text-white";
};

const getChargeBorderColor = (charges: string[]) => {
  const firstCharge = charges[0]?.toLowerCase() || "";
  if (firstCharge.includes("oui") || firstCharge.includes("dui")) {
    return "border-l-red-500";
  }
  if (firstCharge.includes("assault") || firstCharge.includes("a&b")) {
    return "border-l-orange-500";
  }
  if (firstCharge.includes("theft") || firstCharge.includes("larceny")) {
    return "border-l-blue-500";
  }
  if (firstCharge.includes("drug") || firstCharge.includes("possession")) {
    return "border-l-gray-500";
  }
  if (firstCharge.includes("burglary")) {
    return "border-l-green-500";
  }
  if (firstCharge.includes("robbery")) {
    return "border-l-red-500";
  }
  return "border-l-black";
};

export default function ArrestLogSidebarClient({
  arrests: initialArrests,
  total: initialTotal,
  totalPages: initialTotalPages,
  initialPage = 1,
  filters,
}: ArrestLogSidebarClientProps) {
  const [arrests, setArrests] = useState<ArrestLog[]>(initialArrests || []);
  const [selectedArrest, setSelectedArrest] = useState<ArrestLog | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages || 1);
  const [total, setTotal] = useState(initialTotal || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialData] = useState(
    !!initialArrests && initialArrests.length > 0
  );

  // Update state when initial data changes (e.g., filters change on server)
  useEffect(() => {
    if (initialArrests) {
      setArrests(initialArrests);
    }
    if (initialTotal !== undefined) {
      setTotal(initialTotal);
    }
    if (initialTotalPages !== undefined) {
      setTotalPages(initialTotalPages);
    }
    setCurrentPage(initialPage);
  }, [initialArrests, initialTotal, initialTotalPages, initialPage]);

  // Fetch paginated data - only fetch if we don't have initial data or if page/filters change
  useEffect(() => {
    // Skip initial fetch if we have server-rendered data and we're on page 1 with no filters
    if (
      hasInitialData &&
      currentPage === 1 &&
      !filters?.town &&
      !filters?.dateFrom &&
      !filters?.dateTo
    ) {
      return;
    }

    const fetchArrests = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append("page", currentPage.toString());
        params.append("limit", "25");

        if (filters?.town) {
          params.append("town", filters.town);
        }
        if (filters?.dateFrom) {
          params.append("dateFrom", filters.dateFrom);
        }
        if (filters?.dateTo) {
          params.append("dateTo", filters.dateTo);
        }

        const response = await fetch(`/api/arrests?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch arrests");
        }

        const data = await response.json();
        setArrests(data.arrests || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error("Error fetching arrests:", error);
        setArrests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArrests();
  }, [
    currentPage,
    filters?.town,
    filters?.dateFrom,
    filters?.dateTo,
    hasInitialData,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters?.town, filters?.dateFrom, filters?.dateTo]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const startItem = total === 0 ? 0 : (currentPage - 1) * 25 + 1;
  const endItem = Math.min(currentPage * 25, total);

  return (
    <div className="h-full border-r-2 border-b-2 border-black flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b-2 border-black shrink-0 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold uppercase text-black tracking-tight">ARREST LOGS</h2>
          <span className="text-sm font-bold uppercase bg-black text-white px-2 py-1 rounded">{total}</span>
        </div>
        <div className="mt-3">
          <FilterButton filters={filters}>
            <div className="w-full px-4 py-2 border-2 border-black bg-black text-white font-bold uppercase hover:bg-gray-800 transition-colors text-sm text-center rounded">Filter</div>
          </FilterButton>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto sidebar-scrollbar bg-white">
        {isLoading ? (
          <div className="divide-y-2 divide-gray-200 animate-pulse">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-4 border-l-4 border-l-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="mb-3">
                  <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-40"></div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : arrests.length === 0 ? (
          <div className="p-4 text-center">
            <div className="transit-data text-sm font-bold text-gray-600 uppercase">
              No arrests found
            </div>
          </div>
        ) : (
          <div className="divide-y-2 divide-black px-2">
            {arrests.map((arrest, index) => {
              // Parse date from BigQuery DATE format: { value: "YYYY-MM-DD" }
              let arrestDate: Date | null = null;
              let isValidDate = false;

              if (arrest.arrest_date) {
                try {
                  const dateValue = arrest.arrest_date as any;
                  // Extract date string from BigQuery DATE format
                  const dateStr = dateValue?.value || dateValue;
                  const [year, month, day] = String(dateStr)
                    .split("-")
                    .map(Number);

                  if (year && month && day) {
                    arrestDate = new Date(year, month - 1, day);
                    isValidDate = !isNaN(arrestDate.getTime());
                  }
                } catch {
                  arrestDate = null;
                  isValidDate = false;
                }
              }
              const charges = parseCharges(arrest.charges);
              const chargeColor = getChargeColor(charges);
              const chargeBorderColor = getChargeBorderColor(charges);

              return (
                <div
                  key={`${arrest.arrest_id}-${arrest.arrest_date}-${arrest.first_name}-${arrest.last_name}-${index}`}
                  className={`p-3 mb-2 bg-white hover:bg-gray-50 transition-colors border-l-4 ${chargeBorderColor} shadow-sm rounded`}
                  onClick={() => setSelectedArrest(arrest)}
                >
                  {/* Header with name and date */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-extrabold uppercase text-black truncate">
                        {arrest.first_name} {arrest.last_name}
                      </div>
                      <div className="text-xs font-bold text-gray-600 uppercase">
                        {arrest.age} • {arrest.sex} • {arrest.race}
                      </div>
                    </div>
                    <span className="text-sm font-black text-black ml-2">
                      {isValidDate && arrestDate ? format(arrestDate, "MMM dd, yyyy").toUpperCase() : "N/A"}
                    </span>
                  </div>
                  
                  {/* Location */}
                  <div className="mb-2">
                    <div className="text-sm font-extrabold uppercase text-black">
                      {arrest.city_town}
                      {arrest.zip_code && <span className="text-gray-600 ml-1">• {arrest.zip_code}</span>}
                    </div>
                    {arrest.street_line && <div className="text-xs text-gray-600 uppercase">{arrest.street_line}</div>}
                  </div>
                  
                  {/* Charges */}
                  <div className="flex flex-wrap gap-2">
                    {charges.slice(0, 2).map((charge, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-black text-white font-bold uppercase border border-black rounded">
                        {charge}
                      </span>
                    ))}
                    {charges.length > 2 && <span className="px-2 py-1 text-xs bg-gray-600 text-white font-bold uppercase border border-black rounded">+{charges.length - 2} MORE</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Footer - Fixed at bottom */}
      <div className="bg-white border-t-2 border-black shrink-0 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="transit-data text-xs font-bold text-gray-600 uppercase">
            Showing {startItem}-{endItem} of {total}
          </div>
          <div className="transit-data text-xs font-bold text-black uppercase">
            Page {currentPage} of {totalPages}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || isLoading}
            className={`flex-1 px-4 py-2 border-2 border-black font-bold uppercase text-sm transition-colors ${
              currentPage === 1 || isLoading
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white text-black hover:bg-gray-100"
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages || isLoading}
            className={`flex-1 px-4 py-2 border-2 border-black font-bold uppercase text-sm transition-colors ${
              currentPage === totalPages || isLoading
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            Next
          </button>
        </div>
      </div>
      <ArrestDetailDrawer arrest={selectedArrest} open={Boolean(selectedArrest)} onClose={() => setSelectedArrest(null)} />
    </div>
  );
}
