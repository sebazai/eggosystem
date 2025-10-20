/**
 * Get the correct asset URL for viewer assets
 * @param assetPath - The relative path to the asset (e.g., "maps/de_nuke/radar.png")
 * @returns The full URL to the asset
 */
export function getAssetUrl(assetPath: string): string {
  // Check if we're in a Vite environment
  let assetsUrl = "";

  // Type-safe check for import.meta.env
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env as { VITE_VIEWER_ASSETS_URL?: string };
    assetsUrl = env.VITE_VIEWER_ASSETS_URL || "";
  }

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
