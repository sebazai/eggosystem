export interface TeamWithExternalData {
  external_team_id: string;
  name: string;
}

export interface TeamWithExternalDataValidated extends TeamWithExternalData {
  isValid: boolean;
}
