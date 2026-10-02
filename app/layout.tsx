/**
 * Root layout: fonts, metadata (SEO), and providers (Query, Auth, Theme, Toaster).
 * Wraps all pages; force-dynamic so useSearchParams and server session work correctly.
 */
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { KeyboardShortcutsProvider } from "@/components/providers/KeyboardShortcutsProvider";
import { LocaleProvider } from "@/lib/i18n/locale-context";
import { localeHtmlLang } from "@/lib/i18n/config";
import { resolveLocale } from "@/lib/i18n/server";
import localFont from "next/font/local";
import type { Metadata } from "next";
import React from "react";
import { AuthProvider } from "@/contexts";
import { ShellSsrProvider } from "@/contexts/shell-ssr-context";
import { getSession } from "@/lib/auth-server";
import { mapSessionToAppUser } from "@/lib/auth/map-session-user";
import { getShellNotificationsForUser } from "@/lib/server/notifications-data";
import { QueryProvider } from "@/lib/react-query";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { AuthSessionToasts } from "@/components/shared/AuthSessionToasts";
import { SuppressApiErrorOverlay } from "@/components/shared/SuppressApiErrorOverlay";
import { RouteWarmPrefetch } from "@/components/providers/RouteWarmPrefetch";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

/**
 * The `poppins` shell font now loads from the bundled Geist variable font.
 * Keeping the local source removes the Google Fonts fetch at dev/build time
 * (unreachable in some networks and the source of Turbopack font-module
 * failures); the CSS variable name stays so existing `poppins` classes work.
 */
const poppins = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-poppins",
  weight: "100 900",
});

/** Force dynamic rendering for all routes so useSearchParams etc. work without Suspense and pages render instantly. */
export const dynamic = "force-dynamic";

/** Tab title / share cards follow the UI language (Chinese by default). */
export async function generateMetadata(): Promise<Metadata> {
  const isZh = (await resolveLocale()) === "zh";
  const title = isZh
    ? "HAKI ERP — 出口贸易数字化管理系统"
    : "HAKI ERP — Export Trade Management System";
  const description = isZh
    ? "HAKI ERP 是面向出口贸易企业的一体化管理系统：覆盖订单审批、分仓库存、采购收货、发票财务与业绩统计，支持企业内部五个岗位与外部供应商/客户协同。"
    : "HAKI ERP is an integrated management system for export trading companies: order approval, warehouse inventory, purchasing, invoicing and sales performance, with internal staff roles and external supplier/client portals.";

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    authors: [],
    creator: "HAKI ERP",
    publisher: "HAKI ERP",
    applicationName: "HAKI ERP",
    keywords: [
      "export trade",
      "foreign trade ERP",
      "order approval",
      "inventory management",
      "purchase management",
      "sales performance",
      "Next.js",
      "React",
      "Prisma",
      "PostgreSQL",
      "business dashboard",
      "HAKI ERP",
    ],
    icons: {
      icon: "/favicon.ico",
      apple: "/favicon.ico",
      other: [{ rel: "icon", url: "/favicon.ico" }],
    },
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    ),
    openGraph: {
      type: "website",
      locale: isZh ? "zh_CN" : "en_US",
      title,
      description,
      url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      siteName: "HAKI ERP",
      images: [
        {
          url: "/favicon.ico",
          width: 32,
          height: 32,
          alt: "HAKI ERP — Export Trade Management",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/favicon.ico"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/** Optional: set NEXT_PUBLIC_DISABLE_BROWSER_TRANSLATE=true on Vercel prod only (blocks Chrome Translate). */
const disableBrowserTranslate =
  process.env.NEXT_PUBLIC_DISABLE_BROWSER_TRANSLATE === "true";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const initialUser = session ? mapSessionToAppUser(session) : null;
  const shellNotifications = session
    ? await getShellNotificationsForUser(session.id)
    : null;
  // UI language: profile preference → cookie → default (Chinese).
  const initialLocale = await resolveLocale();

  return (
    <html
      lang={localeHtmlLang(initialLocale)}
      {...(disableBrowserTranslate ? { translate: "no" as const } : {})}
      suppressHydrationWarning
      style={{ overscrollBehavior: "none" }}
      data-scroll-behavior="smooth"
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
        suppressHydrationWarning
        style={{ overscrollBehavior: "none" }}
      >
        <ErrorBoundary>
          <QueryProvider>
            <LocaleProvider initialLocale={initialLocale}>
            <AuthProvider initialUser={initialUser}>
              <ShellSsrProvider
                value={
                  shellNotifications ?? {
                    initialNotifications: undefined,
                    initialUnreadCount: undefined,
                  }
                }
              >
              <RouteWarmPrefetch />
              <SuppressApiErrorOverlay />
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <TooltipProvider delayDuration={200}>
                  <KeyboardShortcutsProvider>
                    {children}
                  </KeyboardShortcutsProvider>
                </TooltipProvider>
              </ThemeProvider>
              {/* Toaster must mount before AuthSessionToasts so useToast listeners exist when deferred toasts fire */}
              <Toaster />
              <AuthSessionToasts />
              </ShellSsrProvider>
            </AuthProvider>
            </LocaleProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
