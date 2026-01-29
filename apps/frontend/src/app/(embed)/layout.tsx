import "../globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";

const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b"
};

const kanaHeadingFonts = localFont({
  fallback: ["system-ui", "arial"],
  src: [
    {
      path: "../../../public/fonts/NEXT_ART_Heavy.otf",
      weight: "400",
      style: "normal"
    }
  ],
  variable: "--font-headings"
});

const kanaFonts = localFont({
  fallback: ["system-ui", "arial"],
  src: [
    {
      path: "../../../public/fonts/VeraMono.ttf",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../../public/fonts/VeraMoIt.ttf",
      weight: "400",
      style: "italic"
    },
    {
      path: "../../../public/fonts/VeraMoBd.ttf",
      weight: "700",
      style: "normal"
    },
    {
      path: "../../../public/fonts/VeraMoBI.ttf",
      weight: "700",
      style: "italic"
    }
  ],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Kanaliiga Calendar Embed",
  description: "Embeddable match calendar for Kanaliiga leagues",
  robots: "noindex, nofollow" // Don't index embed pages
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.dark,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

/**
 * Minimal layout for embed pages - no navigation, no footer
 * Just the bare essentials for embedding in iframes
 */
export default function EmbedLayout({
  children
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
          `
          }}
        />
      </head>
      <body
        className={cn(
          `antialiased bg-background`,
          kanaFonts.variable,
          kanaHeadingFonts.variable
        )}
      >
        {children}
      </body>
    </html>
  );
}
