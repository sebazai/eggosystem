export const heppajpgSteamId = "66561198999999902";
export const HoolyzSteamId = "66561198999999905";
export const RealPlayer1SteamId = "66561198999999906";
export const RealPlayer2SteamId = "66561198999999907";
export const RealPlayer3SteamId = "66561198999999908";
export const AabeSteamId = "66561198999999901";
export const QuattraSteamId = "66561198999999903";
export const TrevSteamId = "66561198999999904";
export const PrivateProfilePlayerSteamId = "66561198999999909";
export const NoFaceitRankPlayerSteamId = "66561198999999913";
export const ValidWorkEmail1SteamId = "66561198999999920";
export const ValidWorkEmail2SteamId = "66561198999999921";
export const ValidWorkEmail3SteamId = "66561198999999922";
export const ValidWorkEmail4SteamId = "66561198999999923";
export const ValidWorkEmail5SteamId = "66561198999999924";
export const EligiblePlayerForValidationSteamId = "76561198054765387";
export const IneligiblePlayerForValidationSteamId = "76561197960383236";
export const InsufficientHoursPlayerSteamId = "66561198999999910";
export const ValidationFailurePlayerSteamId = "66561198999999914";
export const IncompleteDetailsPlayerSteamId = "66561198999999911";
export const RaceConditionPlayerSteamId = "66561198999999912";
// E2E critical-workflow IDs (plan range 66561198999999925–66561198999999928)
export const DraftReturnUserSteamId = "66561198999999925";
export const ApprovalOnlySubmitSteamId = "66561198999999926";
export const ManualApprovalTargetSteamId = "66561198999999927";
export const ManualRankTargetSteamId = "66561198999999928";
// A5 add-team signup only – avoids SeasonPlayerRanks race with other tests
export const AddTeamSignupSteamId1 = "66561198999999929";
export const AddTeamSignupSteamId2 = "66561198999999930";
export const AddTeamSignupSteamId3 = "66561198999999931";
export const AddTeamSignupSteamId4 = "66561198999999932";
export const AddTeamSignupSteamId5 = "66561198999999933";
// S1-AC-4 "Configurable signup requirements" tests – dedicated lineup slots.
// Each "missing" target is driven end-to-end through seed + MSW (the third-
// party API mock layer) rather than via Playwright's page.route, so the
// frontend → backend → external-API path is exercised for real.
//
// External rank missing: FACEIT GameRank MSW returns skill_level=0/elo=0 for
// this Steam ID, so the backend's `/platform/.../rank` endpoint legitimately
// reports faceit_level=0 and the frontend records externalRank=0.
export const ConfigurableReqsExternalRankMissingSteamId = "66561198999999934";
// S1-AC-4 dedicated auth user. Kept exclusive to these tests so a prior team
// registration cannot redirect the form into edit mode (useSignupStatus →
// /signup/team/:teamId/edit) and starve the org-dropdown wait.
export const ConfigurableReqsAuthSteamId = "66561198999999935";
// Internal (premier) rank missing: Leetify MSW returns `games: []` so the
// backend's `getCSRank` falls through every code path and ultimately returns
// no rank, frontend converts to rank=-1.
export const ConfigurableReqsInternalRankMissingSteamId = "66561198999999936";
// Hours missing: Steam GetOwnedGames MSW returns an empty games array, so the
// backend's `getPlayerHoursForCS` returns hours=-1. Doubles as the
// Missing Steam owned-games / playtime (hours path) proxy for signup tests.
export const ConfigurableReqsHoursMissingSteamId = "66561198999999937";
