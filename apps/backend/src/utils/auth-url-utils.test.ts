import { isValidReturnUrl, getValidReturnUrl } from "./auth-url-utils";

describe("Auth URL Utils", () => {
  const FRONTEND_URL = "https://kanaliiga.fi";

  beforeEach(() => {
    process.env.FRONTEND_URL = FRONTEND_URL;
  });

  describe("isValidReturnUrl", () => {
    it("should allow relative paths starting with /", () => {
      expect(isValidReturnUrl("/dashboard")).toBe(true);
      expect(isValidReturnUrl("/")).toBe(true);
      expect(isValidReturnUrl("/login-success")).toBe(true);
      expect(isValidReturnUrl("/some/nested/path")).toBe(true);
    });

    it("should allow full URLs matching FRONTEND_URL origin", () => {
      expect(isValidReturnUrl("https://kanaliiga.fi/dashboard")).toBe(true);
      expect(isValidReturnUrl("https://kanaliiga.fi/")).toBe(true);
      expect(isValidReturnUrl("https://kanaliiga.fi")).toBe(true);
    });

    it("should reject URLs with different origins", () => {
      expect(isValidReturnUrl("https://evil.com/dashboard")).toBe(false);
      expect(isValidReturnUrl("https://kanaliiga.fi.evil.com/")).toBe(false);
      expect(isValidReturnUrl("http://kanaliiga.fi/dashboard")).toBe(false); // http vs https
    });

    it("should reject invalid URLs", () => {
      expect(isValidReturnUrl("not-a-url")).toBe(false);
      expect(isValidReturnUrl("")).toBe(false);
      expect(isValidReturnUrl("javascript:alert(1)")).toBe(false);
    });

    it("should handle missing FRONTEND_URL gracefully", () => {
      delete process.env.FRONTEND_URL;
      // Empty string for FRONTEND_URL means no valid full URL can match
      expect(isValidReturnUrl("https://kanaliiga.fi/dashboard")).toBe(false);
      // Relative paths still work
      expect(isValidReturnUrl("/dashboard")).toBe(true);
    });
  });

  describe("getValidReturnUrl", () => {
    it("should return default login-success URL when no returnUrl provided", () => {
      expect(getValidReturnUrl()).toBe("https://kanaliiga.fi/login-success");
      expect(getValidReturnUrl(undefined)).toBe(
        "https://kanaliiga.fi/login-success"
      );
    });

    it("should return default login-success URL for empty string", () => {
      expect(getValidReturnUrl("")).toBe("https://kanaliiga.fi/login-success");
    });

    it("should prepend FRONTEND_URL to relative paths", () => {
      expect(getValidReturnUrl("/dashboard")).toBe(
        "https://kanaliiga.fi/dashboard"
      );
      expect(getValidReturnUrl("/some/path")).toBe(
        "https://kanaliiga.fi/some/path"
      );
    });

    it("should return valid full URL as-is", () => {
      expect(getValidReturnUrl("https://kanaliiga.fi/profile")).toBe(
        "https://kanaliiga.fi/profile"
      );
    });

    it("should fallback to login-success for invalid URLs", () => {
      expect(getValidReturnUrl("https://evil.com/hack")).toBe(
        "https://kanaliiga.fi/login-success"
      );
      expect(getValidReturnUrl("not-a-url")).toBe(
        "https://kanaliiga.fi/login-success"
      );
    });
  });
});
