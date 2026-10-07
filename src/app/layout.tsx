import type { Metadata } from "next";
import { BioRhyme, Syne_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const bioRhyme = BioRhyme({
  variable: "--font-biorhyme",
  subsets: ["latin"],
  weight: ["200", "300", "400", "700", "800"],
});

const syneMono = Syne_Mono({
  variable: "--font-syne-mono",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Glass Half Full",
    template: "%s · Glass Half Full",
  },
  description:
    "A discovery hub for Brisbane's creative scene: DJs, musicians, tattoo artists, visual art, fashion, and more.",
};

/** Header reads the Neon Auth session cookie on every page. */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bioRhyme.variable} ${syneMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
