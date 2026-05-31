export const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b"
} as const;

/**
 * Runs before paint so the page never flashes the wrong theme.
 * Always applies the given theme — ignores localStorage and system preference.
 */
export function createThemeBlockingScript(theme: "dark" | "light"): string {
  const isDark = theme === "dark";
  const color = isDark ? META_THEME_COLORS.dark : META_THEME_COLORS.light;

  return `(function(){try{document.documentElement.classList.toggle('dark',${isDark});var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','${color}')}catch(e){}})();`;
}

export function themeClassName(theme: "dark" | "light"): string | undefined {
  return theme === "dark" ? "dark" : undefined;
}
