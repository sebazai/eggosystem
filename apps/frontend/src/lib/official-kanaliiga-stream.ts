const OFFICIAL_KANALIIGA_TWITCH_LOGINS = [
  "kanaliigatv",
  "kanaliigatv2",
  "kanaliigatv3",
  "kanaliigatv4"
] as const;

const OFFICIAL_LOGIN_SET = new Set<string>(OFFICIAL_KANALIIGA_TWITCH_LOGINS);

function twitchChannelLoginFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.endsWith("twitch.tv")) {
      return null;
    }
    const firstSegment = parsed.pathname.split("/").filter(Boolean)[0];
    return firstSegment ? firstSegment.toLowerCase() : null;
  } catch {
    return null;
  }
}

/**
 * True when any reservation stream URL points at an official KanaliiGa Twitch channel.
 */
export function isOfficialKanaliigaStream(match: {
  stream_urls: string[];
}): boolean {
  return match.stream_urls.some((url) => {
    const login = twitchChannelLoginFromUrl(url);
    return login !== null && OFFICIAL_LOGIN_SET.has(login);
  });
}
