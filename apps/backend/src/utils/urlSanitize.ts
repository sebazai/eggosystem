export const cleanWWWUrl = (url?: string) => {
  if (!url) {
    return null;
  }
  const trimmedUrl = url.trim().toLowerCase();
  if (trimmedUrl.startsWith("www")) {
    // Remove www. and add https://
    const newUrl = trimmedUrl.replace("www.", "https://");
    return newUrl;
  }
  // if trimmed url starts with http://www. or https://www. remove www. return
  if (
    trimmedUrl.startsWith("http://www.") ||
    trimmedUrl.startsWith("https://www.")
  ) {
    return trimmedUrl.replace("www.", "");
  }
  if (trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")) {
    return trimmedUrl;
  }
  return `https://${trimmedUrl}`;
};
