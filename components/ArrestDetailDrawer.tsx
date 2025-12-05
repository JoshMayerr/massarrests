"use client";

import React, { useEffect, useState } from "react";

interface Props {
  arrest: any | null;
  open: boolean;
  onClose: () => void;
}

export default function ArrestDetailDrawer({ arrest, open, onClose }: Props) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted || !arrest) return null;

  const date = arrest.date ?? arrest.arrest_date ?? "Unknown";
  const time = arrest.processing_time ?? arrest.arrest_time ?? "";
  const name = [arrest.first_name ?? arrest.first_name, arrest.last_name ?? arrest.last_name].filter(Boolean).join(" ") || "Unknown";
  const address = arrest.address ?? arrest.street_line ?? "Unknown";
  const city = arrest.city ?? arrest.town ?? arrest.city_town ?? "Unknown";
  const charges = Array.isArray(arrest.charges) ? arrest.charges.join("\n") : arrest.charges ?? arrest.description ?? "";
  const source = arrest.sourceFile ?? arrest.source_file ?? "";
  const arrestId = arrest.arrestId ?? arrest.arrest_id ?? "";
  const race = arrest.race 
  const sex = arrest.sex 

  return (
    <div className="fixed inset-0 z-50 flex items-stretch pointer-events-auto">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${visible ? "opacity-50" : "opacity-0"}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`relative ml-auto w-full max-w-md bg-white border-l-2 border-black shadow-xl p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold">Arrest Details</h3>
          <button onClick={onClose} className="text-sm text-gray-600">Close</button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500">Date</div>
            <div className="text-sm font-medium">{date}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Processing Time</div>
            <div className="text-sm font-medium">{time}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Name</div>
            <div className="text-sm font-medium">{name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Race</div>
            <div className="text-sm font-medium">{race}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Sex</div>
            <div className="text-sm font-medium">{sex}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Address</div>
            <div className="text-sm font-medium">{address}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">City / Town</div>
            <div className="text-sm font-medium">{city}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Charges</div>
            <div className="text-sm font-medium whitespace-pre-wrap">{charges}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Source File</div>
            <div className="text-sm font-medium">{source}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Arrest ID</div>
            <div className="text-sm font-medium">{arrestId}</div>
          </div>
        </div>
      </aside>
    </div>
  );
}
