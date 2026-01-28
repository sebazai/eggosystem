# E2E Test Plan Execution Analysis

## ✅ Plan Execution Confirmation

**Status: CONFIRMED - Plan Successfully Executed**

All todos in the plan have been completed:

- ✅ All 4 Steam ID constants added (DraftReturnUserSteamId, ApprovalOnlySubmitSteamId, ManualApprovalTargetSteamId, ManualRankTargetSteamId)
- ✅ All e2e-test-data entries added with correct account IDs (15022-15025)
- ✅ All MSW handlers updated (GameRank, Metadata, GetOwnedGames)
- ✅ All seed data configured correctly
- ✅ All E2E tests implemented (S2, S3, A1, A2, A3, A4, A5)
- ✅ All checkpoints passed

**Note:** Two todos were intentionally cancelled:

- `e2e-a1-mocks` and `e2e-a2-mocks` - Playwright route mocks were cancelled, likely because existing mocks in `beforeEach` handle these cases.

---

## 🔍 Test Overlap Analysis

### Overlap Found in SignupForm.spec.ts

#### 1. **Steam ID Validation Tests** (Lines 427-560)

- **Test 1:** "should validate Steam IDs with different approval states" (lines 428-469)
  - Tests: InsufficientHoursPlayer, Quattra (approved), Trev (not approved)
- **Test 2:** "should resolve player by nickname from database" (lines 471-501)
  - Tests: heppajpg nickname resolution
- **Test 3:** "should resolve player by nickname using Enter key" (lines 503-533)
  - Tests: Aabe nickname resolution with Enter key
- **Test 4:** "should show error when nickname not found" (lines 535-559)
  - Tests: Non-existent nickname error

**Overlap Assessment:**

- Tests 2 and 3 have **minor overlap** - both test nickname resolution, but Test 3 adds Enter key interaction which is valuable
- **Recommendation:** Keep both, but consider consolidating if Enter key test is sufficient

#### 2. **Complete Registration Flow Tests** (Lines 563-921)

- **Test 1:** "should complete full registration flow and successfully submit" (lines 564-666)
  - Uses: ValidWorkEmail1-5, full flow with submit
- **Test 2:** "should validate captain and co-captain assignment comprehensively" (lines 668-778)
  - Uses: ValidWorkEmail2, focuses on captain/co-captain validation
- **Test 3:** "when player in SeasonPlayerApprovals has unverified email..." (S3) (lines 780-835)
  - Uses: ApprovalOnlySubmitSteamId + heppajpg + ValidWorkEmail1-3
- **Test 4:** "should save draft, re-open registration..." (S2) (lines 837-920)
  - Uses: DraftReturnUserSteamId + ValidWorkEmail1-5

**Overlap Assessment:**

- Tests 1 and 2 have **significant overlap** - both test full registration flow
- Test 1 focuses on complete flow, Test 2 focuses on captain validation
- **Recommendation:** Test 2 could be merged into Test 1 or made more focused on edge cases only

#### 3. **External Rank Error Tests** (Lines 924-1088)

- **Test 1:** "should show external rank error for player without FaceIT rank" (lines 925-963)
  - Tests: NoFaceitRankPlayerSteamId error display
- **Test 2:** "should not allow form submission with external rank error" (lines 965-1037)
  - Tests: NoFaceitRankPlayerSteamId + valid players, submit disabled
- **Test 3:** "should not show duplicate external rank error..." (lines 1039-1087)
  - Tests: Multiple NoFaceitRankPlayerSteamId entries, duplicate error handling

**Overlap Assessment:**

- Tests 1 and 2 have **moderate overlap** - both use NoFaceitRankPlayerSteamId
- **Recommendation:** Keep separate as Test 1 focuses on error display, Test 2 on submission blocking

#### 4. **Admin Registration Tests** (Lines 1090-1484)

- **A1:** Manual approval workflow (lines 1100-1221)
- **A2:** Manual rank workflow (lines 1223-1342)
- **A3:** Bulk approve (lines 1344-1375)
- **A4:** Manual validity (lines 1377-1407)
- **A5:** Admin add-team signup (lines 1409-1483)

**Overlap Assessment:**

- **No significant overlap** - each test covers distinct admin workflows
- **Recommendation:** Keep all as they test different admin features

---

## ❌ Missing Validation Corner Cases

Based on the schema validation rules and backend validation logic, the following corner cases are **NOT covered**:

### 1. **Duplicate Steam ID Validation** ⚠️ CRITICAL

**Missing:** Test that duplicate Steam IDs in the lineup show validation errors

- **Schema rule:** `refine` checks `steamIds.size === players.length` (line 105-106 in signup/index.ts)
- **Current coverage:** None
- **Test needed:** Add 5 players where 2 have the same Steam ID, verify error message "Each player must have a unique Steam ID"

### 2. **Captain/Co-Captain Discord Link Validation** ⚠️ CRITICAL

**Missing:** Test that captain/co-captain without Discord linked shows error

- **Schema rule:** `refine` checks `discordLinked === true` for captains (lines 22-29 in signup/index.ts)
- **Current coverage:** None explicitly
- **Test needed:** Assign captain/co-captain to player without Discord linked, verify error "Captains and co-captains must link their Discord account"

### 3. **Invalid SteamID64 Format** ⚠️ HIGH PRIORITY

**Missing:** Test that non-SteamID64 formats (after resolution) show validation errors

- **Schema rule:** SteamID must be 17 numeric characters (lines 31-47 in signup/index.ts)
- **Current coverage:** Tests nickname resolution success, but not format validation failure
- **Test needed:** Enter invalid Steam ID format that can't be resolved, verify format error

### 4. **Team External ID Length Validation** (Non-Kanaliiga) ⚠️ MEDIUM PRIORITY

**Missing:** Test team external ID length validation for non-Kanaliiga platforms

- **Schema rule:** 2-50 characters for non-Kanaliiga platforms (lines 114-129 in signup/index.ts)
- **Current coverage:** Only tests UUID format for FACEIT, not length limits
- **Test needed:** Test with <2 characters and >50 characters for FACEIT platform

### 5. **Minimum 5 Players Validation** ⚠️ MEDIUM PRIORITY

**Missing:** Test that form requires exactly 5 players minimum

- **Schema rule:** `players.array().min(5)` (line 91 in signup/index.ts)
- **Current coverage:** None
- **Test needed:** Try to submit with 4 players, verify error

### 6. **Maximum 9 Players Validation** ⚠️ LOW PRIORITY

**Missing:** Test that form allows up to 9 players maximum

- **Schema rule:** `players.array().max(9)` (line 92 in signup/index.ts)
- **Current coverage:** None (all tests use exactly 5 players)
- **Test needed:** Add 9 players, verify form accepts; try 10, verify error

### 7. **Missing Captain/Co-Captain Edge Cases** ⚠️ MEDIUM PRIORITY

**Missing:** Test edge cases for captain assignment:

- **Zero captains:** No captain assigned, verify error
- **Multiple captains:** 2+ captains assigned, verify error
- **Zero co-captains:** No co-captain assigned, verify error
- **Multiple co-captains:** 2+ co-captains assigned, verify error
- **Same person as captain and co-captain:** One person assigned both roles, verify error

**Current coverage:** Only tests "exactly one captain and one co-captain" validation message exists, but doesn't test all edge cases

### 8. **Backend Validation: Profile Data Missing** ⚠️ MEDIUM PRIORITY

**Missing:** Test backend error when `is_valid_full_name` is false

- **Backend rule:** Throws `BadRequestError` if `!playerData.is_valid_full_name` (lines 341-345 in season-team-registration.services.ts)
- **Current coverage:** None
- **Test needed:** Use player with invalid profile data, verify backend error message

### 9. **Backend Validation: Player Not Found** ⚠️ HIGH PRIORITY

**Missing:** Test backend error when Steam ID doesn't exist in database

- **Backend rule:** Throws `BadRequestError` if `filteredData.length !== playerSteamIds.length` (lines 320-324)
- **Current coverage:** None (all tests use seeded players)
- **Test needed:** Submit with Steam ID not in database, verify backend error

### 10. **Terms and Conditions Validation** ⚠️ LOW PRIORITY

**Missing:** Test that terms checkbox is required before submission

- **Schema rule:** `captainHasReadTermAndConditions: z.literal<boolean>(true)` (lines 84-88)
- **Current coverage:** Tests check the checkbox, but don't test that submission fails without it
- **Test needed:** Try to submit without checking terms, verify error

### 11. **Internal Rank Error (Premier) Without Manual Rank** ⚠️ MEDIUM PRIORITY

**Missing:** Test internal rank error for player without Premier rank (not just ManualRankTarget)

- **Current coverage:** A2 test covers ManualRankTarget, but doesn't test general internal rank error
- **Test needed:** Use player without Premier rank (and no manual rank), verify internal rank error

### 12. **Email Verification Error Display** ⚠️ MEDIUM PRIORITY

**Missing:** Test that unverified email shows proper error message

- **Current coverage:** S3 test verifies no email error for manually approved player, but doesn't test error display for unapproved unverified email
- **Test needed:** Use player with unverified email (not manually approved), verify email verification error is visible

---

## 📊 Summary

### Overlap Summary

- **Minor overlaps:** 2 instances (nickname resolution tests, external rank error tests)
- **Moderate overlap:** 1 instance (complete registration flow vs captain validation)
- **Recommendation:** Consider consolidating Test 2 in "Complete Registration Flow" into Test 1 or making it more focused

### Missing Tests Summary

- **Critical:** 2 tests (duplicate Steam IDs, captain Discord link)
- **High Priority:** 3 tests (invalid SteamID64 format, player not found, internal rank error)
- **Medium Priority:** 5 tests (team external ID length, profile data missing, captain edge cases, email verification error, minimum players)
- **Low Priority:** 2 tests (maximum players, terms validation)

**Total Missing:** 12 validation corner case tests

---

## 🎯 Recommendations

1. **Address Critical Missing Tests First:**
   - Duplicate Steam ID validation
   - Captain/co-captain Discord link validation

2. **Consolidate Overlapping Tests:**
   - Merge captain validation test into complete registration flow test, or make it more focused on edge cases only

3. **Add High Priority Missing Tests:**
   - Invalid SteamID64 format validation
   - Backend player not found error
   - General internal rank error (not just manual rank)

4. **Consider Test Organization:**
   - Group validation tests by category (Steam ID, captain, rank, email, etc.)
   - Create separate describe blocks for each validation type
