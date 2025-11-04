"use client";

import { useState, ReactNode } from "react";
import FilterModal from "./FilterModal";

interface FilterButtonProps {
  children: ReactNode;
}

export default function FilterButton({ children }: FilterButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>
      <FilterModal open={open} onOpenChange={setOpen} />
    </>
  );
}
