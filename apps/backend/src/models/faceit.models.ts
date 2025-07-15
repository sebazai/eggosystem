import { type FaceitValidationError } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const saveWebhookData = async (
  data: string,
  details: string | null,
  errorType: FaceitValidationError | null = null
) => {
  return runQuery<{ insertId: number }>(
    "INSERT INTO FaceitWebhooks (data, details, error_type) VALUES (?, ?, ?)",
    [JSON.stringify(data), JSON.stringify(details), errorType]
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
