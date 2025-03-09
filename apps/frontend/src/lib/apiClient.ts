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

export const apiFetch = async <T>(url: string): Promise<T> => {
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
        refreshSubscribers = [];
        return;
      }

      throw new Error("Token refresh failed");
    } catch (error) {
      console.error("Refresh failed:", error);
      refreshSubscribers = [];
      throw error;
    } finally {
      isRefreshing = false;
    }
  };
  const fetchWithRetry = async (): Promise<T> => {
    const response = await fetch(`${envConfig.CLIENT_API_URL}/api/v1${url}`, {
      credentials: "include"
    });

    if (response.status === 401) {
      return new Promise((resolve, reject) => {
        addRefreshSubscriber(async () => {
          try {
            const retryResponse = await fetchWithRetry();
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
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  };

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      addRefreshSubscriber(async () => {
        try {
          const retryResponse = await fetchWithRetry();
          resolve(retryResponse);
        } catch (retryError) {
          reject(retryError);
        }
      });
    });
  }

  return fetchWithRetry();
};
