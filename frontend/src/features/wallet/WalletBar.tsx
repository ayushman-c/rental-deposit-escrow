"use client";

import { useWallet } from "@/providers/WalletProvider";
import { Button } from "@/components/Button";

export function WalletBar() {
  const {
    address,
    isConnected,
    isConnecting,
    balance,
    connect,
    disconnect,
  } = useWallet();

  return (
    <div className="flex items-center gap-3">
      {isConnected ? (
        <>
          <div className="text-right">
            {balance && (
              <p className="text-xs text-gray-400">
                {Number(balance).toFixed(2)} XLM
              </p>
            )}
            <p className="text-sm text-gray-300 font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
          <Button variant="ghost" onClick={disconnect}>
            Disconnect
          </Button>
        </>
      ) : (
        <Button onClick={connect} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect Freighter"}
        </Button>
      )}
    </div>
  );
}
