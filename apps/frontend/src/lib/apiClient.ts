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

interface ApiFetchGet {
  url: string;
  method?: "GET";
}

interface ApiFetchPost {
  url: string;
  method: "POST";
  body: Record<string, unknown>;
}

type ApiFetch = ApiFetchGet | ApiFetchPost;
export async function apiFetch<T>({
  url,
  method,
  body
}: ApiFetchPost): Promise<T>;
export async function apiFetch<T>({ url, method }: ApiFetchGet): Promise<T>;
export async function apiFetch<T>(params: ApiFetch): Promise<T> {
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
  const fetchWithRetry = async (): Promise<T> => {
    const response = await fetch(
      `${envConfig.CLIENT_API_URL}/api/v1${params.url}`,
      {
        method: params.method ?? "GET",
        ...(params.method === "POST" && {
          body: JSON.stringify(params.body),
          headers: { "Content-Type": "application/json" }
        }),
        credentials: "include"
      }
    );

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
}
