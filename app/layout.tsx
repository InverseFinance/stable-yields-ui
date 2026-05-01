import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Web3Provider } from "@/components/web3-provider";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LanguageProvider } from "@/lib/useLanguage";
import { Toaster } from "@/components/Toaster";
import { JsonLd } from "@/components/JsonLd";
import { buildOrganizationJsonLd } from "@/lib/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.stableyields.info"),
  title: "Stable Yields - Compare Stablecoin APYs in DeFi",
  applicationName: "Stable Yields",
  icons: "/logo.webp",
  authors: [{ name: "Inverse Finance", url: "https://www.inverse.finance" }],
  description: "Earn & compare the best stablecoin yields across major DeFi protocols. Free, real-time APY data from DeFiLlama and on-chain sources.",
  keywords: ['Stable Yields', 'Stablecoin Yields', 'Yield', 'Stablecoins', 'DeFi', 'Yield-bearing stablecoins', 'DeFi Yields', 'Crypto Yield Comparator', 'Crypto Yield Table', 'Crypto Yield Calculator', 'Crypto Yield Rate', 'Crypto Yield Rate Table', 'Crypto Yield Rate Calculator', 'Crypto Yield Rate Comparator', 'Earn Crypto Yield', 'Earn Stablecoin yield', 'Earn crypto yield',
    'DeFi Yield Comparator', 'DeFi Yield Table', 'DeFi Yield Calculator', 'DeFi Yield Rate', 'DeFi Yield Rate Table', 'DeFi Yield Rate Calculator', 'DeFi Yield Rate Comparator', 'Earn DeFi Yield', 'Earn Stablecoin yield', 'Earn DeFi yield'
  ],
  openGraph: {
    title: "Stable Yields - Compare Stablecoin APYs in DeFi",
    description: "Earn & compare the best stablecoin yields across major DeFi protocols. Free, real-time data from DeFiLlama and on-chain sources.",
    url: "https://www.stableyields.info",
    siteName: "Stable Yields",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Stable Yields - Compare Stablecoin APYs",
    description: "Free, real-time stablecoin yield comparison across DeFi protocols.",
  },
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
        <JsonLd data={buildOrganizationJsonLd()} />
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
        {/* <LanguageProvider> */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Web3Provider>
            <div className="min-h-screen flex flex-col">
              <div className="relative flex flex-row gap-2 justify-center md:justify-end px-2 py-2">
                <ConnectButton
                  accountStatus={{ smallScreen: 'address', largeScreen: 'full' }}
                  chainStatus={'icon'}
                  showBalance={false}
                />
                <div className="absolute md:relative right-2 top-2 md:top-0 md:right-0">
                  <ThemeToggle />
                </div>
              </div>
              <main className="flex-1 flex flex-col gap-0 items-center justify-start" style={{ width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                {children}
              </main>
              <footer className="py-6 flex gap-4 flex-col items-center justify-center">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <a href="/faq" className="hover:text-foreground transition-colors">FAQ</a>
                  <a href="/methodology" className="hover:text-foreground transition-colors">Methodology</a>
                  <a href="/about" className="hover:text-foreground transition-colors">About</a>
                </div>
                <a
                  href="https://www.inverse.finance"
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
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
        {/* </LanguageProvider> */}
      </body>
    </html>
  );
}
