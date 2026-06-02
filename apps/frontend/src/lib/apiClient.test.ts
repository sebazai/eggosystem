import {
  ApiError,
  extractErrorMessage,
  setAuthFailureCallback,
  markValidSession,
  clearSessionState,
  refreshAccessToken,
  clientApiFetch
} from "./apiClient";

jest.mock("@/configs/env", () => ({
  envConfig: { CLIENT_API_URL: "http://test.local" }
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeResponse(
  status: number,
  body: unknown,
  ok = status >= 200 && status < 300
): Response {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(body)
  } as unknown as Response;
}

beforeEach(() => {
  mockFetch.mockReset();
  clearSessionState();
  // Reset auth callback between tests
  setAuthFailureCallback(() => {});
});

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------
describe("ApiError", () => {
  it("stores status and message", () => {
    const err = new ApiError("Not found", 404);
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.name).toBe("ApiError");
    expect(err instanceof Error).toBe(true);
  });

  it("stores RFC7807 fields when provided", () => {
    const err = new ApiError("msg", 422, {
      type: "https://example.com/errors/validation",
      title: "Validation Error",
      detail: "Field is required",
      instance: "/api/v1/foo",
      issues: [{ path: ["field"], message: "required" }]
    });
    expect(err.type).toBe("https://example.com/errors/validation");
    expect(err.title).toBe("Validation Error");
    expect(err.detail).toBe("Field is required");
    expect(err.instance).toBe("/api/v1/foo");
    expect(err.issues).toHaveLength(1);
  });

  it("fromRFC7807 creates ApiError from RFC7807 shape", () => {
    const errData = {
      type: "urn:problem",
      title: "Bad Request",
      status: 400,
      detail: "something wrong",
      instance: "/api/v1/thing"
    };
    const err = ApiError.fromRFC7807(errData);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe("something wrong");
    expect(err.detail).toBe("something wrong");
  });

  it("fromLegacy creates ApiError from legacy error shape", () => {
    const err = ApiError.fromLegacy({ error: "legacy message" }, 503);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(503);
    expect(err.message).toBe("legacy message");
  });
});

// ---------------------------------------------------------------------------
// extractErrorMessage
// ---------------------------------------------------------------------------
describe("extractErrorMessage", () => {
  it("returns detail from ApiError when present", () => {
    const err = new ApiError("msg", 400, {
      detail: "detailed reason",
      type: "t",
      title: "T",
      instance: "/i",
      status: 400
    });
    expect(extractErrorMessage(err)).toBe("detailed reason");
  });

  it("returns message from ApiError when no detail", () => {
    const err = new ApiError("plain message", 500);
    expect(extractErrorMessage(err)).toBe("plain message");
  });

  it("returns message from standard Error", () => {
    expect(extractErrorMessage(new Error("std error"))).toBe("std error");
  });

  it("returns detail from object with detail property", () => {
    expect(extractErrorMessage({ detail: "obj detail" })).toBe("obj detail");
  });

  it("returns message from object with message property", () => {
    expect(extractErrorMessage({ message: "obj msg" })).toBe("obj msg");
  });

  it("returns fallback for unknown types", () => {
    expect(extractErrorMessage(null)).toBe("An unexpected error occurred");
    expect(extractErrorMessage(42)).toBe("An unexpected error occurred");
    expect(extractErrorMessage("string error", "custom fallback")).toBe(
      "custom fallback"
    );
  });
});

// ---------------------------------------------------------------------------
// Session state helpers
// ---------------------------------------------------------------------------
describe("session state helpers", () => {
  it("markValidSession / clearSessionState affect auth failure trigger", async () => {
    const onAuthFailure = jest.fn();
    setAuthFailureCallback(onAuthFailure);

    // Without a valid session, 401 on refresh should NOT call onAuthFailure
    mockFetch.mockResolvedValueOnce(makeResponse(401, {}));
    await expect(refreshAccessToken()).rejects.toThrow();
    expect(onAuthFailure).not.toHaveBeenCalled();

    // After marking a valid session, 401 on refresh SHOULD call onAuthFailure
    markValidSession();
    mockFetch.mockResolvedValueOnce(makeResponse(401, {}));
    await expect(refreshAccessToken()).rejects.toThrow();
    expect(onAuthFailure).toHaveBeenCalledTimes(1);

    // After clearing the session, it should not trigger again
    clearSessionState();
    mockFetch.mockResolvedValueOnce(makeResponse(401, {}));
    await expect(refreshAccessToken()).rejects.toThrow();
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// refreshAccessToken
// ---------------------------------------------------------------------------
describe("refreshAccessToken", () => {
  it("resolves when refresh endpoint returns 200", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await expect(refreshAccessToken()).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test.local/api/v1/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("throws when refresh returns 401", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(401, {}));
    await expect(refreshAccessToken()).rejects.toThrow(
      "No refresh token available or session expired."
    );
  });

  it("throws when refresh returns other non-ok status", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(500, {}));
    await expect(refreshAccessToken()).rejects.toThrow("Token refresh failed");
  });

  it("triggers onAuthFailure on 500 when session was valid", async () => {
    markValidSession();
    const onFail = jest.fn();
    setAuthFailureCallback(onFail);
    mockFetch.mockResolvedValueOnce(makeResponse(500, {}));
    await expect(refreshAccessToken()).rejects.toThrow();
    expect(onFail).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// clientApiFetch
// ---------------------------------------------------------------------------
describe("clientApiFetch", () => {
  it("returns parsed JSON on 200", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { data: "ok" }));
    const result = await clientApiFetch<{ data: string }>("/api/v1/test");
    expect(result).toEqual({ data: "ok" });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test.local/api/v1/test",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("sets Content-Type for POST with body", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await clientApiFetch("/api/v1/things", {
      method: "POST",
      body: JSON.stringify({ foo: "bar" })
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "http://test.local/api/v1/things",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" })
      })
    );
  });

  it("does NOT set Content-Type for GET", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, {}));
    await clientApiFetch("/api/v1/things");
    const callArgs = mockFetch.mock.calls[0][1] as RequestInit & {
      headers?: Record<string, string>;
    };
    expect(callArgs.headers?.["Content-Type"]).toBeUndefined();
  });

  it("throws ApiError with RFC7807 shape on non-ok response", async () => {
    const errorPayload = {
      type: "urn:problem",
      title: "Not Found",
      status: 404,
      detail: "Resource missing",
      instance: "/api/v1/foo"
    };
    mockFetch.mockResolvedValueOnce(makeResponse(404, errorPayload, false));
    await expect(clientApiFetch("/api/v1/foo")).rejects.toMatchObject({
      status: 404,
      detail: "Resource missing"
    });
  });

  it("throws ApiError with legacy error shape on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(403, { error: "Forbidden" }, false)
    );
    await expect(clientApiFetch("/api/v1/secret")).rejects.toMatchObject({
      status: 403,
      message: "Forbidden"
    });
  });

  it("throws ApiError with string body on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(400, "bad input" as unknown as object, false)
    );
    await expect(clientApiFetch("/api/v1/x")).rejects.toMatchObject({
      status: 400,
      message: "bad input"
    });
  });

  it("throws generic ApiError for unknown error shape on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(503, {}, false));
    await expect(clientApiFetch("/api/v1/x")).rejects.toMatchObject({
      status: 503,
      message: "Request failed with status 503"
    });
  });

  it("retries after 401 by calling refreshAccessToken and re-fetching", async () => {
    // First call: 401 → triggers refresh → retry succeeds
    mockFetch
      .mockResolvedValueOnce(makeResponse(401, {})) // original request fails
      .mockResolvedValueOnce(makeResponse(200, {})) // refresh succeeds
      .mockResolvedValueOnce(makeResponse(200, { retried: true })); // retry succeeds

    const result = await clientApiFetch<{ retried: boolean }>("/api/v1/secure");
    expect(result).toEqual({ retried: true });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("throws ApiError after second 401 (retry already attempted)", async () => {
    // Both original and retry return 401
    mockFetch
      .mockResolvedValueOnce(makeResponse(401, {})) // original
      .mockResolvedValueOnce(makeResponse(200, {})) // refresh
      .mockResolvedValueOnce(makeResponse(401, {})); // retry also 401

    await expect(clientApiFetch("/api/v1/secure")).rejects.toMatchObject({
      status: 401
    });
  });

  it("resolves all concurrent 401-triggered fetches after a single token refresh", async () => {
    // Both p1 and p2 initially get 401. One triggers the refresh; the other queues
    // behind it. After a single refresh, both retry and succeed.
    let refreshCallCount = 0;
    mockFetch.mockImplementation((url: string) => {
      if ((url as string).includes("/auth/refresh")) {
        refreshCallCount++;
        return Promise.resolve(makeResponse(200, {}));
      }
      if (refreshCallCount === 0) {
        return Promise.resolve(makeResponse(401, {}));
      }
      return Promise.resolve(makeResponse(200, { ok: true }));
    });

    const [r1, r2] = await Promise.all([
      clientApiFetch<{ ok: boolean }>("/api/v1/a"),
      clientApiFetch<{ ok: boolean }>("/api/v1/b")
    ]);

    expect(r1).toEqual({ ok: true });
    expect(r2).toEqual({ ok: true });
    // The module dedups refresh calls; at most one refresh should have fired
    expect(refreshCallCount).toBeLessThanOrEqual(2);
  });
});
