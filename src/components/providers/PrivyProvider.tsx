"use client";

import { PrivyProvider as Privy } from "@privy-io/react-auth";
import { baseSepolia } from "viem/chains";

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  // const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "clpi57jg1000eju08e6hhgcgn"; // Default dev app ID

  const appId = "cmgdm7tro009zl50csn3xnyn2";

  return (
    <Privy
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#676FFF",
          logo: "/icon.png",
        },
        loginMethods: ["wallet", "email", "farcaster"],
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      {children}
    </Privy>
  );
}

