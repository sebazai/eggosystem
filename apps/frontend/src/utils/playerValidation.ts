import type { PlayerValidationResult } from "@eggosystem/types";

/**
 * Extracts all validation errors from a PlayerValidationResult
 * @param validationResult The validation result from the API
 * @returns Array of error messages, empty if no errors
 */
export function getPlayerValidationErrors(
  validationResult: PlayerValidationResult | null | undefined
): string[] {
  if (!validationResult) {
    return [];
  }

  const errors: string[] = [];

  // Check hours validation
  if (!validationResult.hours.success) {
    if (validationResult.hours.error) {
      errors.push(`Hours: ${validationResult.hours.error}`);
    } else if (validationResult.hours.value <= 0) {
      errors.push("Hours: Player hours not found or invalid");
    } else {
      errors.push("Hours: Validation failed");
    }
  }

  // Check rank validation
  if (!validationResult.rank.success) {
    if (validationResult.rank.error) {
      errors.push(`Rank: ${validationResult.rank.error}`);
    } else if (validationResult.rank.value <= 0) {
      errors.push("Rank: CS2 rank not found or invalid");
    } else {
      errors.push("Rank: Validation failed");
    }
  }

  // Check platform rank validation
  if (!validationResult.platform_rank.success) {
    if (validationResult.platform_rank.error) {
      errors.push(`Platform Rank: ${validationResult.platform_rank.error}`);
    } else if (validationResult.platform_rank.value <= 0) {
      errors.push("Platform Rank: Platform rank not found or invalid");
    } else {
      errors.push("Platform Rank: Validation failed");
    }
  }

  // Check profile validation
  if (!validationResult.profile.success) {
    if (validationResult.profile.error) {
      errors.push(`Profile: ${validationResult.profile.error}`);
    } else if (!validationResult.profile.data) {
      errors.push("Profile: Player profile not found");
    } else {
      // Check specific profile issues
      const profile = validationResult.profile.data;
      if (!profile.work_email_verified) {
        errors.push("Profile: Work email not verified");
      }
      if (!profile.is_valid_work_email) {
        errors.push("Profile: Invalid work email");
      }
      if (!profile.is_valid_full_name) {
        errors.push("Profile: Invalid full name");
      }
    }
  }

  return errors;
}
