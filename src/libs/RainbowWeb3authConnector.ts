import { CHAIN_NAMESPACES } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";

const name = "Web3auth";
const iconUrl = "https://res.cloudinary.com/beincrypto/image/upload/v1661461003/logos/ukflgfdxacovx9yzyrr4.png";

/**
 * rainbowWeb3AuthConnector component
 * @param param0 
 * @returns 
 */
export const rainbowWeb3AuthConnector = ({ chains }: any) => {
  // Create Web3Auth Instance
  const chainConfig = {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x" + chains[0].id.toString(16),
    rpcTarget: chains[0].rpcUrls.default.http[0],
    displayName: chains[0].name,
    tickerName: chains[0].nativeCurrency?.name,
    ticker: chains[0].nativeCurrency?.symbol,
    blockExplorer: chains[0].blockExplorers?.default.url[0],
  };

  // create Web3Auth object
  const web3AuthInstance = new Web3Auth({
    clientId: `${process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID}`,
    chainConfig,
    uiConfig: {
      theme: "light",
      loginMethodsOrder: ["google", "apple", "line", "twitter"],
      defaultLanguage: "en",
      appLogo: iconUrl, // Your App Logo Here
      modalZIndex: "2147483647",
      appName: name,
    },
    web3AuthNetwork: "cyan",
    enableLogging: true,
  });

  // Add openlogin adapter for customisations
  const privateKeyProvider = new EthereumPrivateKeyProvider({
    config: { chainConfig },
  });

  const openloginAdapterInstance = new OpenloginAdapter({
    adapterSettings: {
      network: "cyan",
      uxMode: "popup",
      whiteLabel: {
        name: "Sample Rainbow + userOp.js Dapp",
        logoLight: iconUrl,
        logoDark: iconUrl,
        defaultLanguage: "en",
        dark: true,
      },
    },
  });
  web3AuthInstance.configureAdapter(openloginAdapterInstance);

  return {
    id: "web3auth",
    name,
    iconUrl,
    iconBackground: "#fff",
    createConnector: () => {
      const connector = new Web3AuthConnector({
        chains: chains,
        options: {
          web3AuthInstance,
        },
      });
      return {
        connector,
      };
    },
  };
};