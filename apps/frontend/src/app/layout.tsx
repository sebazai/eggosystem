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
import { AuthProvider } from "@/context/AuthContext";
import { FilterProvider } from "@/context/FilterContext";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";

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

const poppinsFont = localFont({
  fallback: ["system-ui", "arial"],
  src: [
    {
      path: "../../public/fonts/poppins/Poppins-Regular.ttf",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../public/fonts/poppins/Poppins-Bold.ttf",
      weight: "700",
      style: "normal"
    }
  ],
  variable: "--font-poppins"
});

export const metadata: Metadata = {
  title: { default: "Kanahub", template: "%s | Kanahub by Kanaliiga" },
  description: "Kanahub Statistics and Analytics",
  applicationName: "Kanahub"
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
          `min-h-svh flex flex-col antialiased bg-kana`,
          kanaFonts.variable,
          kanaHeadingFonts.variable,
          poppinsFont.variable
        )}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            // enableSystem
            disableTransitionOnChange
          >
            <Suspense>
              <FilterProvider appId="730">
                <SkipToContent />
                <KfcRain />
                <ScrollToTop />
                <div className="flex flex-col min-h-svh min-w-[200px] w-full">
                  <Navigation />
                  <div className="flex flex-grow justify-center w-full">
                    <div className="w-full max-w-screen-2xl px-4 sm:px-8 lg:px-16">
                      <main className="md:py-6 py-4" id="main-content">
                        {children}
                      </main>
                    </div>
                  </div>
                  <Footer />
                </div>
              </FilterProvider>
            </Suspense>
          </ThemeProvider>
        </AuthProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
