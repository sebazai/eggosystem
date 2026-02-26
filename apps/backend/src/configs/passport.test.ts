import type { SteamUserPayload } from "@eggosystem/types";

// Capture the strategy callback from passport-steam
type StrategyCallback = (
  identifier: string,
  profile: {
    id: string;
    displayName: string;
    _json: { realname?: string };
  },
  done: (error: unknown, user?: SteamUserPayload) => void
) => Promise<void>;

let capturedCallback: StrategyCallback;

// Mock passport-steam to capture the strategy callback
jest.mock("passport-steam", () => ({
  Strategy: jest.fn().mockImplementation((_options, callback) => {
    capturedCallback = callback;
    return { name: "steam" };
  })
}));

// Mock passport to capture the use() call
jest.mock("passport", () => {
  const mock = {
    use: jest.fn()
  };
  return { __esModule: true, default: mock };
});

// Mock auth models
jest.mock("../models/auth.models");

import {
  getAuthUserBySteamId,
  createAccountForSteam,
  updateSteamLinkedAccountUsername
} from "../models/auth.models";

const mockGetAuthUser = getAuthUserBySteamId as jest.MockedFunction<
  typeof getAuthUserBySteamId
>;
const mockCreateAccount = createAccountForSteam as jest.MockedFunction<
  typeof createAccountForSteam
>;
const mockUpdateUsername =
  updateSteamLinkedAccountUsername as jest.MockedFunction<
    typeof updateSteamLinkedAccountUsername
  >;

// Import passport config - this triggers passport.use() and captures the callback
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("./passport");

describe("Passport Steam Strategy", () => {
  const mockProfile = {
    id: "76561198000012345",
    displayName: "TestPlayer",
    _json: { realname: "Test Real Name" }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return existing user payload and update username", async () => {
    mockGetAuthUser.mockResolvedValue({
      account_id: 100,
      steam_id: mockProfile.id,
      nickname: "OldNickname",
      full_name: "Test",
      work_email: null,
      is_work_email_personal_email: false,
      provider: "steam"
    });
    mockUpdateUsername.mockResolvedValue(undefined);

    const done = jest.fn();
    await capturedCallback("identifier", mockProfile, done);

    expect(mockGetAuthUser).toHaveBeenCalledWith(mockProfile.id);
    expect(mockUpdateUsername).toHaveBeenCalledWith(
      mockProfile.id,
      mockProfile.displayName
    );
    expect(done).toHaveBeenCalledWith(null, {
      account_id: 100,
      provider_id: mockProfile.id,
      nickname: mockProfile.displayName,
      provider: "steam"
    });
  });

  it("should create new account when user does not exist", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    mockCreateAccount.mockResolvedValue({
      account_id: 200,
      provider_id: mockProfile.id
    });

    const done = jest.fn();
    await capturedCallback("identifier", mockProfile, done);

    expect(mockCreateAccount).toHaveBeenCalledWith({
      steamId: mockProfile.id,
      steamDisplayName: mockProfile.displayName,
      steamRealname: "Test Real Name"
    });
    expect(done).toHaveBeenCalledWith(null, {
      account_id: 200,
      provider_id: mockProfile.id,
      nickname: mockProfile.displayName,
      provider: "steam"
    });
  });

  it("should call done with error when account creation fails", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    const creationError = new Error("DB insert failed");
    mockCreateAccount.mockRejectedValue(creationError);

    const done = jest.fn();
    await capturedCallback("identifier", mockProfile, done);

    expect(done).toHaveBeenCalledWith(creationError);
  });

  it("should still return user when username update fails", async () => {
    mockGetAuthUser.mockResolvedValue({
      account_id: 100,
      steam_id: mockProfile.id,
      nickname: "OldNickname",
      full_name: "Test",
      work_email: null,
      is_work_email_personal_email: false,
      provider: "steam"
    });
    mockUpdateUsername.mockRejectedValue(new Error("Update failed"));

    const done = jest.fn();
    await capturedCallback("identifier", mockProfile, done);

    // Should still succeed - username update failure is non-fatal
    expect(done).toHaveBeenCalledWith(null, {
      account_id: 100,
      provider_id: mockProfile.id,
      nickname: mockProfile.displayName,
      provider: "steam"
    });
  });

  it("should not call updateUsername for new users", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    mockCreateAccount.mockResolvedValue({
      account_id: 300,
      provider_id: mockProfile.id
    });

    const done = jest.fn();
    await capturedCallback("identifier", mockProfile, done);

    expect(mockUpdateUsername).not.toHaveBeenCalled();
  });
});
