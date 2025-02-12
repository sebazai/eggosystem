import "@eggosystem/ui/globals.css";
import type { Metadata, Viewport } from "next"

import { cn } from "@eggosystem/utils/styles"

import { ThemeProvider } from "../providers/theme-provider";

const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
}


export const metadata: Metadata = {
  title: "Eggosystem",
  description: "Kanahub statistics and analytics",
}

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
    <head>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.theme === 'dark' || ((!('theme' in localStorage) || localStorage.theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.querySelector('meta[name="theme-color"]').setAttribute('content', '${META_THEME_COLORS.dark}')
              }
            } catch (_) {}
          `,
        }}
      />
    </head>
    <body
      className={cn(
        "bg-background min-h-svh overscroll-none font-sans antialiased"
      )}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </body>
  </html>
  );
}
