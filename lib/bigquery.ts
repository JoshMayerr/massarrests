import { BigQuery } from "@google-cloud/bigquery";

/**
 * Creates an authenticated BigQuery client using a Service Account Key.
 * * PREREQUISITE:
 * 1. Download your Service Account JSON key.
 * 2. Base64 encode it: `cat key.json | base64` (Mac/Linux) or via online tool.
 * 3. Set the output as the `GCP_SERVICE_ACCOUNT_KEY` environment variable in Vercel.
 */
export async function getBigQueryClient() {
  if (!process.env.GCP_SERVICE_ACCOUNT_KEY) {
    throw new Error("Missing GCP_SERVICE_ACCOUNT_KEY environment variable");
  }

  // Decode the base64 string back to a JSON object
  const credentials = JSON.parse(
    Buffer.from(process.env.GCP_SERVICE_ACCOUNT_KEY, "base64").toString("utf-8")
  );

  // Initialize BigQuery with the credentials object
  return new BigQuery({
    projectId: process.env.GCP_PROJECT_ID,
    credentials,
  });
}
