import { ReactNode } from "react";
import ArrestLogSidebarClient from "./ArrestLogSidebarClient";
import MobileArrestTable from "./MobileArrestTable";
import { ArrestLog } from "@/lib/types";
import { Filters } from "@/lib/dataService";
import FilterButton from "./FilterButton";
import { ChevronsUpDown, Edit2, EditIcon } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  arrests: ArrestLog[];
  total?: number;
  totalPages?: number;
  filters?: Filters;
}

export default function Layout({
  children,
  arrests,
  total,
  totalPages,
  filters,
}: LayoutProps) {
  const displayText = filters?.town
    ? filters.town.toUpperCase()
    : "MASSACHUSETTS";

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar - Fixed position, full height, hidden on mobile */}
      <div className="fixed left-0 top-0 w-80 h-screen hidden lg:block z-10">
        <ArrestLogSidebarClient
          arrests={arrests}
          total={total}
          totalPages={totalPages}
          initialPage={1}
          filters={filters}
        />
      </div>

      {/* Main Content Area with Header */}
      <div className="lg:ml-80 min-h-screen flex flex-col">
        {/* Header - Only covers main content area */}
        <div className="border-b-2 bg-white">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <div className="flex items-center flex-wrap gap-2">
                <FilterButton>
                  <div className="transit-red-bar px-3 sm:px-4 py-2 cursor-pointer hover:opacity-80 transition-opacity flex items-center">
                    <span className="text-lg sm:text-2xl">{displayText}</span>
                    <ChevronsUpDown className="w-4 h-4 ml-2 cursor-pointer hover:opacity-80 transition-opacity" />
                  </div>
                </FilterButton>
                <h1 className="text-lg sm:text-xl font-extrabold uppercase text-black tracking-tight">
                  POLICE LOGS
                </h1>
              </div>
              {/* Last Updated Status */}
              <div className="inline-flex items-center bg-gray-100 rounded px-2 py-1 border border-gray-300 self-start sm:self-auto">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1.5 shrink-0"></div>
                <span className="text-[10px] sm:text-[12px] font-bold uppercase whitespace-nowrap">
                  LAST UPDATED: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
            <p className="transit-data font-bold text-xs sm:text-sm text-black uppercase">
              MAPPING OF POLICE LOGS IN MASSACHUSETTS ACROSS 200 CITIES AND
              TOWNS
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6 space-y-6 lg:space-y-8">
          {children}
        </div>

        {/* Mobile Arrest Table - Only visible on mobile */}
        <MobileArrestTable
          arrests={arrests}
          total={total}
          totalPages={totalPages}
          initialPage={1}
          filters={filters}
        />
      </div>
    </div>
  );
}
