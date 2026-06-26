import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/Card";
import { useEscrows } from "@/hooks/useEscrows";
import { useWallet } from "@/providers/WalletProvider";
import { EscrowCard } from "./EscrowCard";

export function EscrowList() {
  const { escrows, loading, refetch } = useEscrows();
  const { isConnected } = useWallet();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-100">
          Escrows
          {escrows.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({escrows.length})
            </span>
          )}
        </h2>
      </div>

      {loading && (
        <Card>
          <p className="text-gray-400 text-sm">Loading escrows...</p>
        </Card>
      )}

      {!loading && escrows.length === 0 && (
        <Card>
          <div className="text-center py-8 space-y-3">
            <p className="text-gray-400">No escrows found</p>
            {isConnected && (
              <p className="text-sm text-gray-500">
                Create your first escrow to get started
              </p>
            )}
          </div>
        </Card>
      )}

      <AnimatePresence mode="popLayout">
        {escrows.map((escrow) => (
          <motion.div
            key={escrow.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <EscrowCard escrow={escrow} onAction={refetch} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
