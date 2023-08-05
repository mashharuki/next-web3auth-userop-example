import "@rainbow-me/rainbowkit/styles.css";

import { rainbowWeb3AuthConnector } from "@/libs/RainbowWeb3authConnector";
import "@/styles/globals.css";
import {
  connectorsForWallets,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { AppProps } from "next/app";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

// get chains & publicClient data
const { chains, publicClient } = configureChains(
  [
    avalancheFuji,
  ],
  [
    alchemyProvider({ 
      apiKey: `${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}` 
    }),
    publicProvider(),
  ]
);

// connecttosの設定
const connectors = connectorsForWallets([
  {
    groupName: "Recommended",
    wallets: [
      walletConnectWallet({ chains }),
      metaMaskWallet({ chains }),
      rainbowWeb3AuthConnector({ chains }) as any,
    ],
  },
]);

// wagmi用の設定
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

/**
 * App Component
 */
export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}