import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['www.inverse.finance', 'images.ctfassets.net', 'inverse.finance', 'assets.coingecko.com', 'cdn.jsdelivr.net', 'icons.llamao.fi', 'coin-images.coingecko.com', 'token-icons.llamao.fi', 'raw.githubusercontent.com', 'resources.curve.finance', 'token-assets-one.vercel.app', 'yearn.fi', 'app.aave.com'],
    // loader: 'custom',
    // loaderFile: './components/ui/image.tsx',
  },
};

export default nextConfig;
