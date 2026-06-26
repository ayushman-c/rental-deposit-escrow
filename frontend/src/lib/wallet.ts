"use client";

type StellarWalletsKitType = typeof import("@creit.tech/stellar-wallets-kit").StellarWalletsKit;
type NetworksType = typeof import("@creit.tech/stellar-wallets-kit").Networks;

let initPromise: Promise<{ StellarWalletsKit: StellarWalletsKitType; Networks: NetworksType }> | null = null;

async function ensureInit() {
  if (!initPromise) {
    initPromise = (async () => {
      const [
        { StellarWalletsKit, Networks },
        { FreighterModule, FREIGHTER_ID },
        { defaultModules },
      ] = await Promise.all([
        import("@creit.tech/stellar-wallets-kit"),
        import("@creit.tech/stellar-wallets-kit/modules/freighter"),
        import("@creit.tech/stellar-wallets-kit/modules/utils"),
      ]);

      StellarWalletsKit.init({
        modules: [
          new FreighterModule(),
          ...defaultModules().filter((m: any) => m.productId !== FREIGHTER_ID),
        ],
        network: Networks.TESTNET,
        selectedWalletId: FREIGHTER_ID,
        authModal: {
          showInstallLabel: true,
          hideUnsupportedWallets: false,
        },
      });

      return { StellarWalletsKit, Networks };
    })();
  }
  return initPromise;
}

export async function connectWallet(): Promise<string> {
  const { StellarWalletsKit } = await ensureInit();
  try {
    const { address } = await StellarWalletsKit.authModal();
    return address;
  } catch (e: any) {
    if (e?.code === -1) throw new Error("Connection cancelled");
    throw new Error(e?.message || "Failed to connect wallet");
  }
}

export async function disconnectWallet(): Promise<void> {
  const { StellarWalletsKit } = await ensureInit();
  StellarWalletsKit.disconnect();
}

export async function getWalletAddress(): Promise<string | null> {
  if (!initPromise) return null;
  const { StellarWalletsKit } = await initPromise;
  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address;
  } catch {
    return null;
  }
}

export async function signTransaction(
  xdr: string,
  opts?: { networkPassphrase?: string },
): Promise<string> {
  const { StellarWalletsKit, Networks } = await ensureInit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: opts?.networkPassphrase || Networks.TESTNET,
  });
  return signedTxXdr;
}
