import { NextResponse } from "next/server";
import { fetchPoliceLogs } from "@/lib/bigquery";

export async function GET(req: Request) {
  console.log("API HERE IS GETTING CALLED")
  const { searchParams } = new URL(req.url);

  const town = searchParams.get("town") || undefined;
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;

  const rows = await fetchPoliceLogs({ town, dateFrom, dateTo });

  // Convert BigQuery row into the ArrestLog shape your frontend expects
  const arrests = rows.map((r: any, idx: number) => ({
    id: idx + 1,
    incidentType: r.call_reason || "Unknown",
    date: r.date,
    city: r.location ? parseCity(r.location) : "Unknown",
    county: "MIDDLESEX", // you can improve this later
    description: `${r.call_reason} — ${r.action}`,
    charges: r.arrest_reference ? [r.arrest_reference] : [],
  }));

  return NextResponse.json({ arrests });
}

function parseCity(raw: string) {
  // Example: "[NAT 3072] 12 ROCKRIDGE RD - 12 ROCKRIDGE RD"
  const match = raw.split("-")[0].trim().split(" ");
  return match[match.length - 1] ?? "Unknown";
}
