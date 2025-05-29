export type AllstarClip = {
  event: string;
  _id: string;
  clipUrl: string;
  username: string;
  demoUrl: string;
  roundNumber: number;
  steamid: string;
  clipLength: number;
  status: "Submitted" | "Processed";
  clipTitle: string;
  shareId: string;
  createdDate: string; // ISO date string
  updated: string; // ISO date string
  clipSnapshotURL: string;
  clipImageThumbURL: string;
  requestId: string;
  additionalData: {
    key: string;
    value: string;
  }[];
};

export type AllstarClipError = {
  event: string; // 'clip'
  status: "Error";
  requestId: string;
  message: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isAllstarClipError(obj: any): obj is AllstarClipError {
  return (
    obj &&
    typeof obj === "object" &&
    obj.event === "clip" &&
    obj.status === "Error" &&
    typeof obj.requestId === "string" &&
    typeof obj.message === "string"
  );
}
