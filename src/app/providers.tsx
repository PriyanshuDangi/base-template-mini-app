"use client";

import dynamic from "next/dynamic";
import { MiniAppProvider } from "@neynar/react";
import { PrivyProvider } from "~/components/providers/PrivyProvider";

const WagmiProvider = dynamic(
  () => import("~/components/providers/WagmiProvider"),
  {
    ssr: false,
  }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider>
      <WagmiProvider>
        <MiniAppProvider analyticsEnabled={true}>{children}</MiniAppProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
