export * from "./match-details";
export * from "./webhooks";
export * from "./FaceITTeamDetails.interface";

export type FaceitValidationError =
  | "WEBHOOK_VALIDATION_ERROR"
  | "MATCH_DETAILS_VALIDATION_ERROR"
  | "UNKNOWN_ERROR";
