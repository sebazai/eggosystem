import "./globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { ThemeProvider } from "../providers/theme-provider";
import { cn } from "@/lib/utils";
import { Navigation } from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import SkipToContent from "@/components/layout/skip-to-content";
import { KfcRain } from "@/components/layout/kfc-rain";
import ScrollToTop from "@/components/layout/scroll-to-top";
import { Suspense } from "react";
import { AuthProvider } from "@/context/AuthContext";

const META_THEME_COLORS = {
  light: "#ffffff",
  dark: "#09090b"
};

const kanaHeadingFonts = localFont({
  fallback: ["system-ui", "arial"],
  src: [
    {
      path: "../../public/fonts/NEXT_ART_Heavy.otf",
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
      path: "../../public/fonts/VeraMono.ttf",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../public/fonts/VeraMoIt.ttf",
      weight: "400",
      style: "italic"
    },
    {
      path: "../../public/fonts/VeraMoBd.ttf",
      weight: "700",
      style: "normal"
    },
    {
      path: "../../public/fonts/VeraMoBI.ttf",
      weight: "700",
      style: "italic"
    }
  ],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: { default: "Eggosystem", template: "%s | Eggosystem" },
  description: "Kanahub statistics and analytics"
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({
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
          `bg-kana min-h-svh flex flex-col antialiased`,
          kanaFonts.variable,
          kanaHeadingFonts.variable
        )}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SkipToContent />
            <KfcRain />
            <ScrollToTop />
            <div className="flex flex-col min-h-svh min-w-[200px]">
              <Navigation />
              <div className="flex flex-grow justify-center w-full">
                <div className="w-full max-w-screen-xl px-4 sm:px-8 lg:px-16">
                  <Suspense>
                    <main className="md:py-6 py-4" id="main-content">
                      {children}
                    </main>
                  </Suspense>
                </div>
              </div>
              <Footer />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
