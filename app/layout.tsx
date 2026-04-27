import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Web3Provider } from "@/components/web3-provider";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LanguageProvider } from "@/lib/useLanguage";
import { Toaster } from "@/components/Toaster";

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
  description: "Earn & compare Stablecoin Yields across major DeFi protocols",
  keywords: ['Stable Yields', 'Stablecoin Yields', 'Yield', 'Stablecoins', 'DeFi', 'Yield-bearing stablecoins', 'DeFi Yields', 'Crypto Yield Comparator', 'Crypto Yield Table', 'Crypto Yield Calculator', 'Crypto Yield Rate', 'Crypto Yield Rate Table', 'Crypto Yield Rate Calculator', 'Crypto Yield Rate Comparator', 'Earn Crypto Yield', 'Earn Stablecoin yield', 'Earn crypto yield', 
    'DeFi Yield Comparator', 'DeFi Yield Table', 'DeFi Yield Calculator', 'DeFi Yield Rate', 'DeFi Yield Rate Table', 'DeFi Yield Rate Calculator', 'DeFi Yield Rate Comparator', 'Earn DeFi Yield', 'Earn Stablecoin yield', 'Earn DeFi yield'
  ],
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
            <Toaster />
          </Web3Provider>
        </ThemeProvider>
        {/* </LanguageProvider> */}
      </body>
    </html>
  );
}
