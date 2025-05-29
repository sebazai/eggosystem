import {
  type MatchGame,
  type AllstarClip,
  AllstarClipError
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const insertClipProcessing = async (
  gameId: MatchGame["id"],
  clipType: "potg"
) => {
  await runQuery(
    "INSERT INTO MatchGameClips (game_id, clip_stats, clip_type) VALUES (?, ?, ?)",
    [gameId, "Processing", clipType]
  );
};

export const updateClipError = async (
  gameId: MatchGame["id"],
  clipType: "potg",
  data: AllstarClipError
) => {
  await runQuery(
    `
    INSERT INTO MatchGameClips (
      game_id,
      clip_status,
      clip_type,
      additional_data
    ) VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      clip_status = VALUES(clip_status),
      additional_data = VALUES(additional_data)
    `,
    [gameId, data.status, clipType, JSON.stringify(data)]
  );
};

export const updateProcessedClip = async (
  gameId: MatchGame["id"],
  clipType: "potg",
  data: AllstarClip
) => {
  await runQuery(
    `
    INSERT INTO MatchGameClips (
      game_id,
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
      gameId,
      data.steamid,
      data.status,
      clipType,
      data._id,
      data.requestId,
      data.clipUrl,
      data.clipImageThumbURL,
      data.clipSnapshotURL,
      data.clipTitle,
      data.clipLength?.toString(),
      JSON.stringify(data.additionalData)
    ]
  );
};
