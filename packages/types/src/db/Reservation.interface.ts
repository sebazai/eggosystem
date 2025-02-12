export interface Reservation {
  id: number;
  date_start: string; // DATETIME as string
  date_end: string; // DATETIME as string
  stream_url: string; // VARCHAR(255)
  hash: string; // VARCHAR(255)
}
