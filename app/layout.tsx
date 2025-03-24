import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stable Yields",
  applicationName: "Stable Yields",
  icons: "/logo.webp",
  authors: [{ name: "Inverse Finance", url: "https://inverse.finance" }],
  description: "Stable Yields across major DeFi protocols",
  keywords: ["Stable Yields", "Yield", "Stablecoins", "DeFi", "Yield-bearing stablecoins", "Stablecoin Yields", "DeFi Yields", "Yield Comparator", "Yield Table", "Yield Calculator", "Yield Rate", "Yield Rate Calculator", "Yield Rate Comparator", "Yield Rate Table", "Yield Rate Calculator", "Yield Rate Comparator", "Yield Rate Table"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=G-G09P58GBG3`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-G09P58GBG3', {
              page_path: window.location.pathname,
            });
          `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-futuristic`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="min-h-screen flex flex-col">
            <ThemeToggle />
            <main className="flex-1 flex flex-col gap-0 items-center justify-start" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
              {children}
            </main>
            <footer className="py-6 flex gap-2 flex-col items-center justify-center">
              <a
                href="https://inverse.finance"
                target="_blank"
                className="text-muted-foreground underline"
              >
                Built by Inverse Finance
              </a>
              <p
                className="text-muted-foreground"
              >
                Sources: Ethereum chain, project APIs and DeFillama
              </p>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
