import {
  createMatchOgImageResponse,
  OG_IMAGE_SIZE
} from "../../opengraph-image.utils";

export const alt = "Match";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image({
  params
}: {
  params: Promise<{ match_id: string; match_game_id: string }>;
}) {
  const { match_id } = await params;
  const matchId = parseInt(match_id, 10);
  return createMatchOgImageResponse(matchId);
}
