import { ReactNode } from "react";
import ArrestLogSidebarClient from "./ArrestLogSidebarClient";
import { ArrestLog } from "@/lib/mockData";

interface LayoutProps {
  children: ReactNode;
  arrests: ArrestLog[];
}

export default function Layout({ children, arrests }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar - Fixed position, full height, hidden on mobile */}
      <div className="fixed left-0 top-0 w-80 h-screen hidden lg:block z-10">
        <ArrestLogSidebarClient arrests={arrests} />
      </div>

      {/* Main Content Area with Header */}
      <div className="lg:ml-80 min-h-screen flex flex-col">
        {/* Header - Only covers main content area */}
        <div className="border-b border-gray-300 bg-white">
          <div className="px-6 py-4">
            <h1 className="transit-header">Massachusetts Police Logs</h1>
            <p className="font-medium text-sm text-gray-600">
              Mapping of police logs in Massachusetts across 200 cities and
              towns.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-6 space-y-6 lg:space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}
