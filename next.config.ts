import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['images.ctfassets.net', 'inverse.finance', 'assets.coingecko.com', 'cdn.jsdelivr.net', 'icons.llamao.fi', 'coin-images.coingecko.com', 'token-icons.llamao.fi', 'raw.githubusercontent.com', 'resources.curve.finance'],
    // loader: 'custom',
    // loaderFile: './components/ui/image.tsx',
  },
};

export default nextConfig;
