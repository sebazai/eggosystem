/// <reference types="vite/client" />
/**
 * Get the correct asset URL for viewer assets
 * @param assetPath - The relative path to the asset (e.g., "maps/de_nuke/radar.png")
 * @returns The full URL to the asset
 */
export function getAssetUrl(assetPath: string): string {
  const assetsUrl = import.meta.env.VITE_VIEWER_ASSETS_URL || "";

  if (assetsUrl) {
    // Ensure the asset path doesn't start with a slash
    const cleanPath = assetPath.startsWith("/")
      ? assetPath.slice(1)
      : assetPath;
    return `${assetsUrl}/${cleanPath}`;
  }

  // Fallback to relative path
  return `/${assetPath}`;
}
