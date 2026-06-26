import { motion } from "framer-motion";
import { useWallet } from "@/providers/WalletProvider";
import { EscrowList } from "@/features/escrow/EscrowList";
import { CreateEscrowForm } from "@/features/escrow/CreateEscrowForm";
import { WalletBar } from "@/features/wallet/WalletBar";
import { Button } from "@/components/Button";
import { useState } from "react";

export default function App() {
  const { isConnected } = useWallet();
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-white">Rental Deposit Escrow</h1>
            <p className="text-xs text-gray-500">Powered by Stellar Soroban</p>
          </div>
          <WalletBar />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {isConnected && (
          <motion.div layout>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">Dashboard</h2>
              <Button
                variant={showCreate ? "secondary" : "primary"}
                onClick={() => setShowCreate((p) => !p)}
              >
                {showCreate ? "Close" : "+ New Escrow"}
              </Button>
            </div>
          </motion.div>
        )}

        {showCreate && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <CreateEscrowForm
              onCreated={() => {
                setShowCreate(false);
                setRefreshKey((k) => k + 1);
              }}
            />
          </motion.div>
        )}

        <EscrowList key={refreshKey} />
      </main>
    </div>
  );
}
