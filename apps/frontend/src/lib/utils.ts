import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const expressFetcher = async <T>(
  ...args: [RequestInfo, RequestInit?]
): Promise<T> => {
  // eslint-disable-next-line prefer-const
  let [url, options] = args;

  // Prepend NEXT_PUBLIC_BASE_PATH if defined
  const basePath = process.env.NEXT_PUBLIC_API_URL;
  if (typeof url === "string" && basePath) {
    url = `${basePath}${url}`;
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    const resultJson = await res.json();
    throw new Error(resultJson.message ?? "An error occurred");
  }
  return res.json();
};

export const nextFetcher = async <T>(
  ...args: [RequestInfo, RequestInit?]
): Promise<T> => {
  // eslint-disable-next-line prefer-const
  let [url, options] = args;

  // Prepend NEXT_PUBLIC_BASE_PATH if defined
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
  if (typeof url === "string" && basePath) {
    url = `${basePath}${url}`;
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    const resultJson = await res.json();
    throw new Error(resultJson.error ?? "An error occurred");
  }
  return res.json();
};

export const createNextImageUrl = (url: string) => {
  if (process.env.NEXT_PUBLIC_BASE_PATH) {
    return `${process.env.NEXT_PUBLIC_BASE_PATH}${url}`;
  }
  return url;
};
