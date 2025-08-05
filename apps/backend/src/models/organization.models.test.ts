import { getOrganizationDiscordInviteLink } from "./organization.models";
import { runQuery } from "../db/mysqlRunQuery";

jest.mock("../db/mysqlRunQuery");

const mockRunQuery = runQuery as jest.Mock;

describe("getOrganizationDiscordInviteLink", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the discord invite link if present", async () => {
    mockRunQuery.mockResolvedValueOnce([
      { discord_invite_link: "https://discord.gg/test" }
    ]);
    const result = await getOrganizationDiscordInviteLink(1);
    expect(result).toBe("https://discord.gg/test");
    expect(mockRunQuery).toHaveBeenCalledWith(
      "SELECT discord_invite_link FROM Organizations WHERE id = ?",
      [1]
    );
  });

  it("returns null if organization not found", async () => {
    mockRunQuery.mockResolvedValueOnce([]);
    const result = await getOrganizationDiscordInviteLink(999);
    expect(result).toBeNull();
  });

  it("returns null if discord_invite_link is null", async () => {
    mockRunQuery.mockResolvedValueOnce([{ discord_invite_link: null }]);
    const result = await getOrganizationDiscordInviteLink(2);
    expect(result).toBeNull();
  });
});
