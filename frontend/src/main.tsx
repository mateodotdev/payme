import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// If needed for legacy support only; remove if not required.
// Uncomment only if wagmi/viem/WalletConnect raise errors in Vite:
// if (typeof window !== 'undefined') {
//   (window as any).global = window;
//   (window as any).process = { env: {} };
// }

import { RainbowKitProvider, getDefaultConfig, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";
import "./index.css";
import App from "./App.tsx";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '13341d916db3579c966fe7d6852649be';

const tempoChain = {
  id: 42431,
  name: "Tempo Testnet",
  nativeCurrency: { name: "pathUSD", symbol: "pathUSD", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.moderato.tempo.xyz"] },
  },
  blockExplorers: {
    default: { name: "Tempo Explorer", url: "https://explore.tempo.xyz" },
  },
  testnet: true,
} as const;

const config = getDefaultConfig({
  appName: "payme",
  projectId,
  chains: [tempoChain],
  transports: {
    [tempoChain.id]: http(),
  },
  ssr: false, // ← disables SSR which improves modal stability on mobile
});

const queryClient = new QueryClient();
console.log("--- MAIN.tsx LOADED (v2.2-RAINBOW-REVERT, ssr:false) ---");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={darkTheme({
            accentColor: '#0052ff',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            overlayBlur: 'small',
          })}
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);