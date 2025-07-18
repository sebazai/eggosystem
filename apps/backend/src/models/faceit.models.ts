import { type FaceitValidationError } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const saveWebhookData = async (
  externalMatchRoomId: string,
  event: string,
  data: string,
  details: string | null,
  errorType: FaceitValidationError | null = null,
  errorDetails: string | null = null
) => {
  return runQuery<{ insertId: number }>(
    "INSERT INTO FaceitWebhooks (external_match_room_id, event, data, details, error_type, error_details) VALUES (?, ?, ?, ?, ?, ?)",
    [
      externalMatchRoomId,
      event,
      JSON.stringify(data),
      JSON.stringify(details),
      errorType,
      errorDetails ? JSON.stringify(errorDetails) : null
    ]
  );
};

export const updateWebhookData = async (
  id: number,
  details: string | null,
  errorType: FaceitValidationError | null = null
) => {
  return runQuery<{ insertId: number }>(
    "UPDATE FaceitWebhooks SET details = ?, error_type = ? WHERE id = ?",
    [JSON.stringify(details), errorType, id]
  );
};
