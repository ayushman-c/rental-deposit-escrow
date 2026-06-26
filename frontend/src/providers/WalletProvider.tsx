"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  connectWallet,
  disconnectWallet,
  getWalletAddress,
} from "@/lib/wallet";

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  balance: string | null;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

async function fetchBalance(address: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://horizon-testnet.stellar.org/accounts/${address}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const native = data.balances?.find((b: any) => b.asset_type === "native");
    return native ? native.balance : null;
  } catch {
    return null;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    balance: null,
  });
  const listenersAttached = useRef(false);

  useEffect(() => {
    getWalletAddress().then((addr) => {
      if (addr) {
        setState((prev) => ({
          ...prev,
          address: addr,
          isConnected: true,
        }));
        fetchBalance(addr).then((bal) =>
          setState((prev) => ({ ...prev, balance: bal })),
        );
      }
    });
  }, []);

  useEffect(() => {
    if (listenersAttached.current) return;
    listenersAttached.current = true;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { StellarWalletsKit, KitEventType } = await import("@creit.tech/stellar-wallets-kit");

      const unsub1 = StellarWalletsKit.on(
        KitEventType.STATE_UPDATED,
        (e: any) => {
          if (e.payload?.address) {
            setState((prev) => ({
              ...prev,
              address: e.payload.address,
              isConnected: true,
            }));
            fetchBalance(e.payload.address).then((bal) =>
              setState((prev) => ({ ...prev, balance: bal })),
            );
          }
        },
      );

      const unsub2 = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
        setState({
          address: null,
          isConnected: false,
          isConnecting: false,
          balance: null,
        });
      });

      cleanup = () => {
        unsub1?.();
        unsub2?.();
      };
    })();

    return () => cleanup?.();
  }, []);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true }));
    try {
      const address = await connectWallet();
      const balance = await fetchBalance(address);
      setState({
        address,
        isConnected: true,
        isConnecting: false,
        balance,
      });
    } catch {
      setState((prev) => ({ ...prev, isConnecting: false }));
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      balance: null,
    });
  }, []);

  const refreshBalance = useCallback(async () => {
    if (state.address) {
      const balance = await fetchBalance(state.address);
      setState((prev) => ({ ...prev, balance }));
    }
  }, [state.address]);

  return (
    <WalletContext.Provider
      value={{ ...state, connect, disconnect, refreshBalance }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
