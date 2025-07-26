import { type FaceitValidationError } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const saveWebhookData = async (
  externalPayloadId: string,
  event: string,
  data: object | unknown,
  details: object | unknown | null,
  errorType: FaceitValidationError | null = null,
  errorDetails: string | null = null
) => {
  return runQuery<{ insertId: number }>(
    "INSERT INTO FaceitWebhooks (external_payload_id, event, data, details, error_type, error_details) VALUES (?, ?, ?, ?, ?, ?)",
    [
      externalPayloadId,
      event,
      JSON.stringify(data),
      details ? JSON.stringify(details) : null,
      errorType,
      errorDetails ? JSON.stringify(errorDetails) : null
    ]
  );
};
