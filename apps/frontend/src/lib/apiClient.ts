import { envConfig } from "@/configs/env";

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

const onTokenRefreshed = () => {
  refreshSubscribers.forEach((callback) => callback());
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: () => void) => {
  refreshSubscribers.push(callback);
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function clientApiFetch<T>(
  ...args: [RequestInfo, RequestInit?]
): Promise<T> {
  const [url, options] = args;

  const refreshAccessToken = async () => {
    if (isRefreshing) return;
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
        throw new Error("No refresh token available or session expired.");
      }

      throw new Error("Token refresh failed");
    } catch (error) {
      refreshSubscribers = [];
      throw error;
    } finally {
      isRefreshing = false;
    }
  };

  const fetchWithRetry = async (retryAttempted = false): Promise<T> => {
    // Prepare headers
    const headers: Record<string, string> = {
      ...((options?.headers as Record<string, string>) || {}),
      ...((options?.method === "POST" || options?.method === "PUT") && {
        "Content-Type": "application/json"
      })
    };

    const response = await fetch(`${envConfig.CLIENT_API_URL}${url}`, {
      method: options?.method ?? "GET",
      ...((options?.method === "POST" || options?.method === "PUT") && {
        body: options?.body
      }),
      headers,
      credentials: "include"
    });

    if (response.status === 401) {
      const errData = await response.json().catch(() => ({}));
      const message =
        typeof errData?.error === "string" ? errData.error : "Unauthorized";

      if (retryAttempted) {
        // Prevent infinite retry loop, but include error message if available
        throw new ApiError(message, 401);
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
      console.error("API Client Error", errData);
      if (typeof errData?.error === "string" || typeof errData === "string") {
        throw new ApiError(
          errData?.error ?? errData ?? "Unknown API error",
          response.status
        );
      }
      throw new Error(`Request failed with status ${response.status}`);
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
