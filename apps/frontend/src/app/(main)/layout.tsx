import "../globals.css";
import type { Viewport } from "next";
import localFont from "next/font/local";

import { ThemeProvider } from "../../providers/ThemeProvider";
import { ChickenAnnouncerProvider } from "@/providers/ChickenAnnouncerProvider";
import { cn } from "@/lib/utils";
import { Navigation } from "@/components/layout/Navigation";
import Footer from "@/components/layout/LayoutFooter";
import SkipToContent from "@/components/layout/SkipToContent";
import { KfcRain } from "@/components/layout/KfcRain";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AcceptPolicyProvider } from "@/context/AcceptPolicyContext";
import { createPageMetadata } from "@/lib/metadata";
import { ChickenFeatureAnnouncer } from "@/components/layout/ChickenFeatureAnnouncer";

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

const poppinsFont = localFont({
  fallback: ["system-ui", "arial"],
  src: [
    {
      path: "../../../public/fonts/poppins/Poppins-Regular.ttf",
      weight: "400",
      style: "normal"
    },
    {
      path: "../../../public/fonts/poppins/Poppins-Bold.ttf",
      weight: "700",
      style: "normal"
    }
  ],
  variable: "--font-poppins"
});

export async function generateMetadata() {
  return createPageMetadata({
    title: { default: "Kanahub", template: "%s | Kanahub by Kanaliiga" },
    description:
      "Kanaliiga is the world's largest corporate esports league, bringing together over 2,500 players from 300+ companies annually. Join us for a season of competitive gaming and community building."
  });
}

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
          `antialiased bg-kana`,
          kanaFonts.variable,
          kanaHeadingFonts.variable,
          poppinsFont.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ChickenAnnouncerProvider>
            <Suspense>
              <SkipToContent />
              <KfcRain />
              <ScrollToTop />
              <ChickenFeatureAnnouncer
                showDelay={3000}
                message="NEW FEATURES! Check them out!"
                featureDate="2025-06-22"
              />
              <div className="min-h-svh min-w-[320px] w-full">
                <AuthProvider>
                  <Navigation />
                  <AcceptPolicyProvider>
                    <main className="w-full" id="main-content">
                      {children}
                    </main>
                  </AcceptPolicyProvider>
                </AuthProvider>
                <Footer />
              </div>
            </Suspense>
          </ChickenAnnouncerProvider>
        </ThemeProvider>

        <Toaster richColors />
      </body>
    </html>
  );
}
