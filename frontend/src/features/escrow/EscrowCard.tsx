import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { EscrowStepper } from "@/components/EscrowStepper";
import { Button } from "@/components/Button";
import { useWallet } from "@/providers/WalletProvider";
import { api } from "@/lib/api";
import type { Escrow } from "@/types";

interface Props {
  escrow: Escrow;
  onAction: () => void;
}

export function EscrowCard({ escrow, onAction }: Props) {
  const { address } = useWallet();

  const isLandlord = address === escrow.landlord;
  const isTenant = address === escrow.tenant;
  const canDeposit = isTenant && escrow.status === "Created";
  const canRequestRelease = isLandlord && escrow.status === "Locked";
  const canApproveRelease = isTenant && escrow.status === "ReleaseRequested";
  const canRaiseDispute =
    (isLandlord || isTenant) &&
    (escrow.status === "Locked" || escrow.status === "ReleaseRequested");
  const canCancel =
    (isLandlord || isTenant) &&
    (escrow.status === "Created" || escrow.status === "WaitingDeposit");

  async function handleAction(action: string) {
    try {
      switch (action) {
        case "deposit":
          await api.escrows.deposit({ escrowId: escrow.escrowId, from: address });
          break;
        case "requestRelease":
          await api.escrows.requestRelease({ escrowId: escrow.escrowId, from: address });
          break;
        case "approveRelease":
          await api.escrows.approveRelease({ escrowId: escrow.escrowId, from: address });
          break;
        case "raiseDispute":
          await api.escrows.raiseDispute({ escrowId: escrow.escrowId, from: address });
          break;
        case "cancel":
          await api.escrows.cancel({ escrowId: escrow.escrowId, from: address });
          break;
      }
      onAction();
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-400">
            Escrow <span className="font-mono text-gray-200">#{escrow.escrowId}</span>
          </p>
          <p className="text-xs text-gray-500 font-mono truncate max-w-[300px]">
            {escrow.contractId}
          </p>
        </div>
        <StatusBadge status={escrow.status} />
      </div>

      <EscrowStepper currentStatus={escrow.status} />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-500">Landlord</p>
          <p className="font-mono text-xs truncate">{escrow.landlord}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Tenant</p>
          <p className="font-mono text-xs truncate">{escrow.tenant}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Amount</p>
          <p className="font-mono">{(Number(escrow.depositAmount) / 1e7).toFixed(2)} XLM</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">End Date</p>
          <p className="font-mono text-xs">
            {new Date(Number(escrow.rentalEndDate) * 1000).toLocaleDateString()}
          </p>
        </div>
      </div>

      {address && (canDeposit || canRequestRelease || canApproveRelease || canRaiseDispute || canCancel) && (
        <div className="flex flex-wrap gap-2">
          {canDeposit && (
            <Button onClick={() => handleAction("deposit")}>Deposit</Button>
          )}
          {canRequestRelease && (
            <Button onClick={() => handleAction("requestRelease")}>
              Request Release
            </Button>
          )}
          {canApproveRelease && (
            <Button onClick={() => handleAction("approveRelease")}>
              Approve Release
            </Button>
          )}
          {canRaiseDispute && (
            <Button variant="danger" onClick={() => handleAction("raiseDispute")}>
              Raise Dispute
            </Button>
          )}
          {canCancel && (
            <Button variant="ghost" onClick={() => handleAction("cancel")}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
