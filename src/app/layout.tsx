import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { appMeta } from "@/config/env";

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
const sora = Sora({ variable: "--font-heading", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: `${appMeta.name} — ${appMeta.tagline}`, template: `%s · ${appMeta.name}` },
  description: appMeta.description,
  applicationName: appMeta.name,
  manifest: "/manifest.webmanifest",
  // "default" (opaque) keeps the iOS status bar as its own bar so app content
  // starts BELOW it in the installed PWA — no overlap. Safe-area padding stays
  // as a belt-and-suspenders for notched/Android cases.
  appleWebApp: { capable: true, statusBarStyle: "default", title: appMeta.name },
  // Favicon/tab icon comes from the file convention src/app/icon.svg. Only the
  // Apple touch icon is declared here.
  icons: { apple: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0b0e14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
