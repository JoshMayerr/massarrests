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
        <div className="border-b-2 bg-white">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="transit-red-bar px-4 py-2 mr-4">
                  MASSACHUSETTS
                </div>
                <h1 className="text-3xl font-extrabold uppercase text-black tracking-tight">
                  POLICE LOGS
                </h1>
              </div>
              {/* Last Updated Status */}
              <div className="inline-flex items-center bg-gray-100 rounded px-2 py-1 border border-gray-300">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1.5"></div>
                <span className="text-[12px] font-bold uppercase">
                  LAST UPDATED: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
            <p className="transit-data font-bold text-sm text-black uppercase">
              MAPPING OF POLICE LOGS IN MASSACHUSETTS ACROSS 200 CITIES AND
              TOWNS
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
