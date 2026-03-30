import { envConfig } from "@/configs/env";

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];
let onAuthFailure: (() => void) | null = null;
let hasHadValidSession = false; // Track if we've had a valid session

// Function to register auth failure callback
export const setAuthFailureCallback = (callback: () => void) => {
  onAuthFailure = callback;
};

// Function to mark that we've had a valid session
export const markValidSession = () => {
  hasHadValidSession = true;
};

// Function to clear session state (for logout)
export const clearSessionState = () => {
  hasHadValidSession = false;
};

const onTokenRefreshed = () => {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: () => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Manually refresh the access token.
 * This is useful when you need to ensure the token has the latest permissions/roles
 * even if the current token hasn't expired yet.
 * @returns Promise that resolves when token is refreshed, or rejects on error
 */
export const refreshAccessToken = async (): Promise<void> => {
  if (isRefreshing) {
    // If already refreshing, wait for it to complete
    return new Promise((resolve, _reject) => {
      addRefreshSubscriber(() => {
        resolve();
      });
      // If refresh fails, the error will be handled by the ongoing refresh
      // Check periodically if refresh completed (success or failure)
      const checkInterval = setInterval(() => {
        if (!isRefreshing) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch(
      `${envConfig.CLIENT_API_URL}/api/v1/auth/refresh`,
      {
        method: "POST",
        credentials: "include"
      }
    );

    if (response.ok) {
      onTokenRefreshed(); // Notify all waiting requests
      return;
    }

    if (response.status === 401) {
      console.warn("No refresh token available or session expired.");
      // Only trigger auth failure if we had a valid session that actually expired
      if (onAuthFailure && hasHadValidSession) {
        onAuthFailure();
      }
      throw new Error("No refresh token available or session expired.");
    }

    // Only trigger auth failure for actual refresh failures when we had a session
    if (onAuthFailure && hasHadValidSession) {
      onAuthFailure();
    }
    throw new Error("Token refresh failed");
  } catch (error) {
    refreshSubscribers = [];
    throw error;
  } finally {
    isRefreshing = false;
  }
};

/**
 * RFC 7807 Problem Details for HTTP APIs
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */
interface RFC7807Error {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  issues?: Array<{
    path: (string | number)[];
    message: string;
  }>;
}

/**
 * Runtime type guard to check if an error response is RFC 7807 compliant
 */
function isRFC7807Error(error: unknown): error is RFC7807Error {
  return (
    typeof error === "object" &&
    error !== null &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (error as any).type === "string" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (error as any).title === "string" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (error as any).status === "number" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (error as any).detail === "string" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (error as any).instance === "string"
  );
}

/**
 * Legacy error format for backward compatibility
 */
interface LegacyError {
  error: string;
}

function isLegacyError(error: unknown): error is LegacyError {
  return (
    typeof error === "object" &&
    error !== null &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typeof (error as any).error === "string"
  );
}

/**
 * Type guard for error objects with optional detail and message properties
 * Used for handling unknown error types in catch blocks
 */
interface ErrorWithDetail {
  detail?: string;
  message?: string;
}

function isErrorWithDetail(error: unknown): error is ErrorWithDetail {
  return (
    typeof error === "object" &&
    error !== null &&
    (typeof (error as Record<string, unknown>).detail === "string" ||
      typeof (error as Record<string, unknown>).message === "string")
  );
}

/**
 * Extracts error message from unknown error types
 * Handles ApiError, Error, and error objects with detail/message properties
 */
export function extractErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred"
): string {
  if (error instanceof ApiError) {
    return error.detail || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (isErrorWithDetail(error)) {
    return error.detail || error.message || fallbackMessage;
  }
  return fallbackMessage;
}

/** True when errData is worth logging (skip empty `{}`, null, empty string, etc.). */
function hasLoggableErrorPayload(errData: unknown): boolean {
  if (errData === null || errData === undefined) {
    return false;
  }
  if (typeof errData === "string") {
    return errData.length > 0;
  }
  if (Array.isArray(errData)) {
    return errData.length > 0;
  }
  if (typeof errData === "object") {
    return Object.keys(errData).length > 0;
  }
  return true;
}

export class ApiError extends Error {
  status: number;
  type?: string;
  title?: string;
  detail?: string;
  instance?: string;
  issues?: Array<{
    path: (string | number)[];
    message: string;
  }>;

  constructor(
    message: string,
    status: number,
    rfc7807Data?: Partial<RFC7807Error>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;

    if (rfc7807Data) {
      this.type = rfc7807Data.type;
      this.title = rfc7807Data.title;
      this.detail = rfc7807Data.detail;
      this.instance = rfc7807Data.instance;
      this.issues = rfc7807Data.issues;
    }
  }

  static fromRFC7807(errorData: RFC7807Error): ApiError {
    return new ApiError(errorData.detail, errorData.status, errorData);
  }

  static fromLegacy(errorData: LegacyError, status: number): ApiError {
    return new ApiError(errorData.error, status);
  }
}

export async function clientApiFetch<T>(
  ...args: [RequestInfo, RequestInit?]
): Promise<T> {
  const [url, options] = args;

  const fetchWithRetry = async (retryAttempted = false): Promise<T> => {
    // Prepare headers
    const methodsWithBody = ["POST", "PUT", "DELETE", "PATCH"];
    const hasBody =
      options?.body && methodsWithBody.includes(options?.method || "");

    const headers: Record<string, string> = {
      ...((options?.headers as Record<string, string>) || {}),
      ...(hasBody && {
        "Content-Type": "application/json"
      })
    };

    const response = await fetch(`${envConfig.CLIENT_API_URL}${url}`, {
      method: options?.method ?? "GET",
      ...(hasBody && {
        body: options?.body
      }),
      headers,
      credentials: "include"
    });

    if (response.status === 401) {
      const errData = await response.json().catch(() => ({}));

      let apiError: ApiError;
      if (isRFC7807Error(errData)) {
        apiError = ApiError.fromRFC7807(errData);
      } else if (isLegacyError(errData)) {
        apiError = ApiError.fromLegacy(errData, 401);
      } else {
        apiError = new ApiError("Unauthorized", 401);
      }

      if (retryAttempted) {
        // Prevent infinite retry loop, but include error message if available
        throw apiError;
      }

      return new Promise((resolve, reject) => {
        addRefreshSubscriber(async () => {
          try {
            const retryResponse = await fetchWithRetry(true);
            resolve(retryResponse);
          } catch (retryError) {
            reject(retryError);
          }
        });

        if (!isRefreshing) {
          refreshAccessToken().catch(reject);
        }
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (hasLoggableErrorPayload(errData)) {
        console.error("API Client Error", errData);
      }

      if (isRFC7807Error(errData)) {
        throw ApiError.fromRFC7807(errData);
      }

      if (isLegacyError(errData)) {
        throw ApiError.fromLegacy(errData, response.status);
      }

      if (typeof errData === "string") {
        throw new ApiError(errData, response.status);
      }

      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status
      );
    }

    return response.json().catch(() => ({}));
  };

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      addRefreshSubscriber(async () => {
        try {
          const retryResponse = await fetchWithRetry(true);
          resolve(retryResponse);
        } catch (retryError) {
          reject(retryError);
        }
      });
    });
  }

  return fetchWithRetry();
}
