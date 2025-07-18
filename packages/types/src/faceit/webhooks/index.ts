// Shared webhook schemas and types
export * from "./Webhooks.interface";

// Individual webhook types and schemas
export * from "./MatchStatusCancelledWebhook.interface";
export * from "./MatchStatusConfiguringWebhook.interface";
export * from "./MatchStatusFinishedWebhook";
export * from "./MatchStatusFinishedAfterAbortWebhook.interface";
export * from "./MatchStatusReadyWebhook.interface";
export * from "./MatchStatusAbortedWebhook.interface";
export * from "./MatchObjectCreatedWebhook.interface";
export * from "./MatchDemoReadyWebhook.interface";
export * from "./ChampionshipCreatedWebhook.interface";
