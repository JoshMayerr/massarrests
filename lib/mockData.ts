export interface ArrestLog {
  id: string;
  date: string;
  city: string;
  county: string;
  lat: number;
  lng: number;
  incidentType: string;
  description: string;
  charges: string[];
}

export const mockArrests: ArrestLog[] = [
  {
    id: "1",
    date: "2024-10-22T14:30:00Z",
    city: "Boston",
    county: "Suffolk",
    lat: 42.3601,
    lng: -71.0589,
    incidentType: "DUI",
    description: "Operating under influence of alcohol",
    charges: ["OUI - Alcohol", "Reckless Operation"],
  },
  {
    id: "2",
    date: "2024-10-22T12:15:00Z",
    city: "Worcester",
    county: "Worcester",
    lat: 42.2626,
    lng: -71.8023,
    incidentType: "Assault",
    description: "Assault and battery on police officer",
    charges: ["A&B on Police Officer", "Resisting Arrest"],
  },
  {
    id: "3",
    date: "2024-10-22T09:45:00Z",
    city: "Cambridge",
    county: "Middlesex",
    lat: 42.3736,
    lng: -71.1097,
    incidentType: "Theft",
    description: "Shoplifting from retail store",
    charges: ["Larceny Under $250"],
  },
  {
    id: "4",
    date: "2024-10-21T23:20:00Z",
    city: "Springfield",
    county: "Hampden",
    lat: 42.1015,
    lng: -72.5898,
    incidentType: "Drug Possession",
    description: "Possession of controlled substance",
    charges: ["Possession Class B Substance"],
  },
  {
    id: "5",
    date: "2024-10-21T18:30:00Z",
    city: "Lowell",
    county: "Middlesex",
    lat: 42.6334,
    lng: -71.3162,
    incidentType: "Warrant",
    description: "Arrest on outstanding warrant",
    charges: ["Default Warrant"],
  },
  {
    id: "6",
    date: "2024-10-21T15:45:00Z",
    city: "New Bedford",
    county: "Bristol",
    lat: 41.6362,
    lng: -70.9342,
    incidentType: "Burglary",
    description: "Breaking and entering dwelling",
    charges: ["Burglary - Dwelling", "Larceny Over $1200"],
  },
  {
    id: "7",
    date: "2024-10-21T11:20:00Z",
    city: "Quincy",
    county: "Norfolk",
    lat: 42.2529,
    lng: -71.0023,
    incidentType: "DUI",
    description: "Operating under influence of drugs",
    charges: ["OUI - Drugs", "Possession Class E Substance"],
  },
  {
    id: "8",
    date: "2024-10-20T22:15:00Z",
    city: "Newton",
    county: "Middlesex",
    lat: 42.337,
    lng: -71.2092,
    incidentType: "Domestic Violence",
    description: "Domestic assault and battery",
    charges: ["A&B - Domestic", "Threats"],
  },
  {
    id: "9",
    date: "2024-10-20T19:30:00Z",
    city: "Brockton",
    county: "Plymouth",
    lat: 42.0834,
    lng: -71.0184,
    incidentType: "Robbery",
    description: "Armed robbery of convenience store",
    charges: ["Armed Robbery", "Assault with Dangerous Weapon"],
  },
  {
    id: "10",
    date: "2024-10-20T16:45:00Z",
    city: "Lynn",
    county: "Essex",
    lat: 42.4668,
    lng: -70.9495,
    incidentType: "Drug Possession",
    description: "Possession with intent to distribute",
    charges: ["Possession with Intent - Class B", "Drug Trafficking"],
  },
  {
    id: "11",
    date: "2024-10-20T14:20:00Z",
    city: "Framingham",
    county: "Middlesex",
    lat: 42.2793,
    lng: -71.4162,
    incidentType: "Theft",
    description: "Motor vehicle theft",
    charges: ["Larceny of Motor Vehicle"],
  },
  {
    id: "12",
    date: "2024-10-20T10:30:00Z",
    city: "Waltham",
    county: "Middlesex",
    lat: 42.3765,
    lng: -71.2356,
    incidentType: "Fraud",
    description: "Credit card fraud",
    charges: ["Credit Card Fraud", "Identity Theft"],
  },
  {
    id: "13",
    date: "2024-10-19T21:15:00Z",
    city: "Malden",
    county: "Middlesex",
    lat: 42.4251,
    lng: -71.0662,
    incidentType: "Assault",
    description: "Simple assault and battery",
    charges: ["A&B"],
  },
  {
    id: "14",
    date: "2024-10-19T17:45:00Z",
    city: "Medford",
    county: "Middlesex",
    lat: 42.4184,
    lng: -71.1062,
    incidentType: "DUI",
    description: "Operating under influence of alcohol",
    charges: ["OUI - Alcohol", "Negligent Operation"],
  },
  {
    id: "15",
    date: "2024-10-19T13:20:00Z",
    city: "Taunton",
    county: "Bristol",
    lat: 41.9001,
    lng: -71.0898,
    incidentType: "Drug Possession",
    description: "Possession of marijuana",
    charges: ["Possession Class D Substance"],
  },
];

export const getStats = () => {
  const total = mockArrests.length;
  const thisWeek = mockArrests.filter((arrest) => {
    const arrestDate = new Date(arrest.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return arrestDate >= weekAgo;
  }).length;

  const thisMonth = mockArrests.filter((arrest) => {
    const arrestDate = new Date(arrest.date);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return arrestDate >= monthAgo;
  }).length;

  return { total, thisWeek, thisMonth };
};

export const getIncidentTypeBreakdown = () => {
  const breakdown: Record<string, number> = {};
  mockArrests.forEach((arrest) => {
    breakdown[arrest.incidentType] = (breakdown[arrest.incidentType] || 0) + 1;
  });
  return breakdown;
};

export const getTopCities = () => {
  const cityCounts: Record<string, number> = {};
  mockArrests.forEach((arrest) => {
    cityCounts[arrest.city] = (cityCounts[arrest.city] || 0) + 1;
  });

  return Object.entries(cityCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }));
};

export const getTimelineData = () => {
  const timeline: Record<string, number> = {};
  mockArrests.forEach((arrest) => {
    const date = new Date(arrest.date).toISOString().split("T")[0];
    timeline[date] = (timeline[date] || 0) + 1;
  });

  return Object.entries(timeline)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
};
