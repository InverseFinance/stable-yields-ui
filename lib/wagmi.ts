import { connectorsForWallets, WalletList } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';
import { fallback, http, injected, unstable_connector, createConfig } from 'wagmi';
import {
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  coinbaseWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';

const walletList: WalletList = [
  {
    groupName: 'Recommended',
    wallets: [injectedWallet, metaMaskWallet, rabbyWallet, coinbaseWallet, walletConnectWallet],
  },
];

const connectors = connectorsForWallets(walletList, {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder',
  appName: 'Stable Yields',
});

export const wagmiConfig = createConfig({
  ssr: true,
  connectors,
  chains: [mainnet],
  transports: {
    [mainnet.id]: fallback([unstable_connector(injected), http()]),
  },
});
