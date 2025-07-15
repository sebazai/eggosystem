// Shared types and schemas
export * from "./Details.interface";

// Individual match detail types and schemas
export * from "./DetailsAborted.interface";
export * from "./DetailsCancelled.interface";
export * from "./DetailsConfiguring.interface";
export * from "./DetailsDemoReady.interface";
export * from "./DetailsFinished.interface";
export * from "./DetailsObjectCreated.interface";
export * from "./DetailsReady.interface";

export class MatchDetailsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchDetailsValidationError";
  }
}
