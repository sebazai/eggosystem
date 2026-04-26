import "../globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AcceptPolicyProvider } from "@/context/AcceptPolicyContext";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { createPageMetadata } from "@/lib/metadata";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { TooltipProvider } from "@/components/ui/tooltip";

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

export const metadata: Metadata = createPageMetadata({
  title: { default: "Kanahub", template: "%s | Kanahub dashboard" },
  description: "Kanaliiga dashboard"
});

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
        <ThemeProvider
          attribute="class"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <Suspense>
            <div className="flex flex-col min-h-svh min-w-[200px] w-full">
              <AuthProvider>
                <TooltipProvider delayDuration={0}>
                  <AcceptPolicyProvider>
                    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
                      <main id="main-content">{children}</main>
                    </WithRoleProtection>
                  </AcceptPolicyProvider>
                </TooltipProvider>
              </AuthProvider>
            </div>
          </Suspense>
        </ThemeProvider>

        <Toaster richColors />
      </body>
    </html>
  );
}
