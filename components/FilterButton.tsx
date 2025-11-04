"use client";

import { useState, ReactNode } from "react";
import FilterModal from "./FilterModal";
import { Filters } from "@/lib/dataService";

interface FilterButtonProps {
  children: ReactNode;
  filters?: Filters;
}

function hasActiveFilters(filters?: Filters): boolean {
  if (!filters) return false;
  return !!(filters.town || filters.dateFrom || filters.dateTo);
}

export default function FilterButton({ children, filters }: FilterButtonProps) {
  const [open, setOpen] = useState(false);
  const hasFilters = hasActiveFilters(filters);

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer relative">
        {children}
        {hasFilters && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </div>
      <FilterModal open={open} onOpenChange={setOpen} />
    </>
  );
}
