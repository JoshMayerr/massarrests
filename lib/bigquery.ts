import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery({
  keyFilename: "./keys/service-account.json", 
  projectId: "xcc-473",
});

export async function fetchPoliceLogs({ town, dateFrom, dateTo }: any = {}) {
    console.log("is this getting hit")
  let query = `
    SELECT
      for_date AS date,
      call_number,
      time,
      call_reason,
      action
    FROM \`xcc-473.police_logs.daily_logs_fake\`
    WHERE 1=1
  `;

  const params: any = {};

  if (town) {
    query += ` AND LOWER(\`location. raw\`) LIKE @town `;
    params.town = `%${town.toLowerCase()}%`;
  }

  if (dateFrom) {
    query += ` AND for_date >= @dateFrom `;
    params.dateFrom = dateFrom;
  }

  if (dateTo) {
    query += ` AND for_date <= @dateTo `;
    params.dateTo = dateTo;
  }

  query += ` ORDER BY for_date DESC`;

  const options = { query, params };
  const [rows] = await bigquery.query(options);
  console.log("✅ BigQuery returned rows:", rows); 
  return rows;
}
