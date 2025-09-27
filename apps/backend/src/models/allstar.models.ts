import {
  type MatchGame,
  type AllstarClip,
  type AllstarClipError
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const insertClipProcessing = async (
  matchGameId: MatchGame["id"],
  clipType: "potg"
) => {
  await runQuery(
    "INSERT INTO MatchGameClips (match_game_id, clip_status, clip_type) VALUES (?, ?, ?)",
    [matchGameId, "Processing", clipType]
  );
};

export const updateClipError = async (
  matchGameId: MatchGame["id"],
  clipType: "potg",
  data: AllstarClipError
) => {
  await runQuery(
    `
    INSERT INTO MatchGameClips (
      match_game_id,
      clip_status,
      clip_type,
      additional_data
    ) VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      clip_status = VALUES(clip_status),
      additional_data = VALUES(additional_data)
    `,
    [matchGameId, data.status.trim(), clipType, JSON.stringify(data).trim()]
  );
};

export const updateProcessedClip = async (
  matchGameId: MatchGame["id"],
  clipType: "potg",
  data: AllstarClip
) => {
  await runQuery(
    `
    INSERT INTO MatchGameClips (
      match_game_id,
      clip_steam_id,
      clip_status,
      clip_type,
      clip_id,
      clip_request_id,
      clip_url,
      clip_thumbnail_url,
      clip_snapshot_url,
      clip_title,
      clip_length,
      additional_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      clip_steam_id = VALUES(clip_steam_id),
      clip_status = VALUES(clip_status),
      clip_type = VALUES(clip_type),
      clip_id = VALUES(clip_id),
      clip_request_id = VALUES(clip_request_id),
      clip_url = VALUES(clip_url),
      clip_thumbnail_url = VALUES(clip_thumbnail_url),
      clip_snapshot_url = VALUES(clip_snapshot_url),
      clip_title = VALUES(clip_title),
      clip_length = VALUES(clip_length),
      additional_data = VALUES(additional_data)
    `,
    [
      matchGameId,
      data.steamid.trim(),
      data.status.trim(),
      clipType,
      data._id.trim(),
      data.requestId.trim(),
      data.clipUrl.trim(),
      data.clipImageThumbURL.trim(),
      data.clipSnapshotURL.trim(),
      data.clipTitle.trim(),
      data.clipLength?.toString().trim(),
      JSON.stringify(data.additionalData).trim()
    ]
  );
};
