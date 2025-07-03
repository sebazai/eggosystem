import { runQuery } from "../db/mysqlRunQuery";

// CREATE TABLE webhooks (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   data JSON                   -- This stores the raw webhook payload
// );

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveWebhookData = async (data: any) => {
  return runQuery("INSERT INTO Webhooks (data) VALUES (?)", [
    JSON.stringify(data)
  ]);
};
