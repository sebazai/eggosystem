/**
 * Validate that a return URL is safe to redirect to.
 * Allows relative paths (starting with "/") and full URLs matching FRONTEND_URL origin.
 */
export const isValidReturnUrl = (returnUrl: string) => {
  try {
    // If it's a relative path (e.g., "/dashboard"), allow it
    if (returnUrl.startsWith("/")) return true;

    // Otherwise, parse it as a full URL
    const parsedUrl = new URL(returnUrl);
    const allowedDomain = new URL(process.env.FRONTEND_URL ?? "").origin;

    return parsedUrl.origin === allowedDomain;
  } catch (_error) {
    return false;
  }
};

/**
 * Get a validated return URL, falling back to FRONTEND_URL/login-success.
 * Relative paths are prepended with FRONTEND_URL.
 */
export const getValidReturnUrl = (returnUrl?: string) => {
  if (!returnUrl) {
    return process.env.FRONTEND_URL + "/login-success";
  }
  if (isValidReturnUrl(returnUrl)) {
    if (returnUrl.startsWith("/")) {
      return process.env.FRONTEND_URL + returnUrl;
    }
    return returnUrl;
  }
  return process.env.FRONTEND_URL + "/login-success";
};
