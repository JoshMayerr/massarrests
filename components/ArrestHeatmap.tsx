"use client";

import { ArrestLog } from "@/lib/mockData";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import leaflet.heat
import "leaflet.heat";

// Extend Leaflet types
declare module "leaflet" {
  namespace L {
    function heatLayer(latlngs: number[][], options?: any): any;
  }
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface ArrestHeatmapProps {
  arrests: ArrestLog[];
}

// Custom component to add heatmap layer
function HeatmapLayer({ arrests }: { arrests: ArrestLog[] }) {
  const map = useMap();

  useEffect(() => {
    let heatLayer: any = null;

    // Wait for map to be ready
    const addHeatmap = () => {
      // Convert arrests to heatmap format: [lat, lng, intensity]
      // Create balanced intensity scaling
      const clusteredData: [number, number, number][] = [];
      const cityCounts: { [key: string]: number } = {};

      // Count arrests per city
      arrests.forEach((arrest) => {
        cityCounts[arrest.city] = (cityCounts[arrest.city] || 0) + 1;
      });

      // Create heat data with higher intensity for better zoom visibility
      arrests.forEach((arrest) => {
        const cityCount = cityCounts[arrest.city];
        // Higher base intensity for better visibility at all zoom levels
        const baseIntensity = 2.0;
        const cityMultiplier = Math.min(cityCount * 1.2, 4.0); // Cap city multiplier at 4.0
        const intensity = baseIntensity + cityMultiplier;
        clusteredData.push([arrest.lat, arrest.lng, intensity]);
      });

      // Debug info (can be removed in production)
      // console.log("Heatmap data:", clusteredData);
      // console.log("Number of arrests:", arrests.length);
      // console.log("City counts:", cityCounts);

      // Use leaflet.heat with settings optimized for all zoom levels
      heatLayer = L.heatLayer(clusteredData as [number, number, number][], {
        radius: 30, // Smaller radius for better zoom behavior
        blur: 12, // Less blur for sharper definition when zoomed
        maxZoom: 18, // Allow full zoom range
        minOpacity: 0.4, // Higher minimum opacity for better visibility
        gradient: {
          0.0: "transparent", // Start with transparent
          0.1: "blue", // Blue at very low intensity
          0.3: "cyan", // Cyan at low intensity
          0.5: "lime", // Lime at medium intensity
          0.7: "yellow", // Yellow at high intensity
          1.0: "red", // Red at maximum intensity
        },
      });

      heatLayer.addTo(map);
    };

    // Add heatmap when map is ready
    if (map) {
      addHeatmap();
    }

    // Cleanup function
    return () => {
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, arrests]);

  return null;
}

export default function ArrestHeatmap({ arrests }: ArrestHeatmapProps) {
  return (
    <div className="">
      <h3 className="transit-section mb-2">Geographic Distribution</h3>
      <div className="h-[500px] w-full border border-gray-300 rounded">
        <MapContainer
          center={[42.4, -71.4]} // Massachusetts center
          zoom={8}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <HeatmapLayer arrests={arrests} />
        </MapContainer>
      </div>
    </div>
  );
}
