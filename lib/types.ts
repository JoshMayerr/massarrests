export interface ArrestLog {
  arrest_id: string;
  first_name: string;
  last_name: string;
  age: number | string; // BigQuery might return this as a string or number depending on the schema
  sex: string;
  race: string;
  charges: string;
  arrest_date: string; // ISO Date string (YYYY-MM-DD)
  arrest_time: string; // HH:MM
  city_town: string;
  street_line: string;
  zip_code?: string | null;
  processing_time: string; // UTC Timestamp
  source_file: string;
}

export interface ArrestApiResponse {
  data: ArrestLog[];
  total?: number;
  error?: string;
}
