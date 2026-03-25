import { isOfficialKanaliigaStream } from "./official-kanaliiga-stream";

describe("isOfficialKanaliigaStream", () => {
  it("returns true for www.twitch.tv official channels", () => {
    expect(
      isOfficialKanaliigaStream({
        stream_urls: ["https://www.twitch.tv/kanaliigatv"]
      })
    ).toBe(true);
  });

  it("returns true for m.twitch.tv", () => {
    expect(
      isOfficialKanaliigaStream({
        stream_urls: ["https://m.twitch.tv/kanaliigatv2"]
      })
    ).toBe(true);
  });

  it("returns true for twitch.tv without www", () => {
    expect(
      isOfficialKanaliigaStream({
        stream_urls: ["https://twitch.tv/kanaliigatv3"]
      })
    ).toBe(true);
  });

  it("matches channel case-insensitively", () => {
    expect(
      isOfficialKanaliigaStream({
        stream_urls: ["https://www.twitch.tv/KanaliigaTV4"]
      })
    ).toBe(true);
  });

  it("returns false for non-official Twitch channel", () => {
    expect(
      isOfficialKanaliigaStream({
        stream_urls: ["https://twitch.tv/somecaster"]
      })
    ).toBe(false);
  });

  it("returns false for non-Twitch URL", () => {
    expect(
      isOfficialKanaliigaStream({
        stream_urls: ["https://youtube.com/watch?v=1"]
      })
    ).toBe(false);
  });

  it("returns false for malformed URL", () => {
    expect(
      isOfficialKanaliigaStream({
        stream_urls: ["not-a-url"]
      })
    ).toBe(false);
  });

  it("returns true if any URL is official among several", () => {
    expect(
      isOfficialKanaliigaStream({
        stream_urls: [
          "https://twitch.tv/caster",
          "https://twitch.tv/kanaliigatv"
        ]
      })
    ).toBe(true);
  });

  it("returns false for empty stream_urls", () => {
    expect(isOfficialKanaliigaStream({ stream_urls: [] })).toBe(false);
  });

  it("returns true for each official channel login", () => {
    const channels = [
      "kanaliigatv",
      "kanaliigatv2",
      "kanaliigatv3",
      "kanaliigatv4"
    ] as const;
    for (const ch of channels) {
      expect(
        isOfficialKanaliigaStream({
          stream_urls: [`https://twitch.tv/${ch}`]
        })
      ).toBe(true);
    }
  });
});
