import "@eggosystem/ui/globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { cn } from "@eggosystem/utils/styles";

import { ThemeProvider } from "../providers/theme-provider";

const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b",
};

const kanaHeadingFonts = localFont({
  fallback: ["system-ui", "arial"],
  src: [
    {
      path: "../../public/fonts/NEXT_ART_Heavy.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-headings",
});

const kanaFonts = localFont({
  fallback: ["system-ui", "arial"],
  src: [
    {
      path: "../../public/fonts/VeraMono.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/VeraMoIt.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/VeraMoBd.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/VeraMoBI.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Eggosystem",
  description: "Kanahub statistics and analytics",
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
};

export default function Layout({
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
          `bg-kana min-h-svh overscroll-none font-sans antialiased`,
          kanaFonts.variable,
          kanaHeadingFonts.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
