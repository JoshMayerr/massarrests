"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCityCoordinates } from "@/lib/cityCoordinates";

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
  cityCounts: Array<{ city: string; count: number }>;
}

// Custom marker icon with count badge
function createMarkerIcon(count: number) {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: #DA291C;
        color: white;
        border: 3px solid black;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${count}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

export default function ArrestHeatmap({ cityCounts }: ArrestHeatmapProps) {
  // Create markers for each city with coordinates
  const cityMarkers = cityCounts.map(({ city, count }) => {
    const coordinates = getCityCoordinates(city);
    return {
      city,
      count,
      coordinates,
    };
  });

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
          {cityMarkers.map((marker) => (
            <Marker
              key={marker.city}
              position={marker.coordinates}
              icon={createMarkerIcon(marker.count)}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-bold text-lg">{marker.city}</div>
                  <div className="text-sm text-gray-600">
                    {marker.count} {marker.count === 1 ? "arrest" : "arrests"}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}
