import { useState } from "react";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { EscrowStepper } from "@/components/EscrowStepper";
import { Button } from "@/components/Button";
import { useWallet } from "@/providers/WalletProvider";
import { api } from "@/lib/api";
import { signTransaction } from "@/lib/wallet";
import type { Escrow } from "@/types";

interface Props {
  escrow: Escrow;
  onAction: () => void;
}

export function EscrowCard({ escrow, onAction }: Props) {
  const { address } = useWallet();
  const [submitting, setSubmitting] = useState<string | null>(null);

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
  const canReleaseAfterTimeout = isLandlord && escrow.status === "ReleaseRequested";
  const canRefundAfterExpiry = isTenant && escrow.status === "Locked";
  const canResolveDispute = escrow.status === "Disputed";

  async function buildSignAndSubmit(
    action: string,
    buildFn: () => Promise<{ xdr: string; contractId: string; networkPassphrase: string }>,
  ) {
    setSubmitting(action);
    try {
      const { xdr, networkPassphrase } = await buildFn();
      const signedXdr = await signTransaction(xdr, { networkPassphrase });
      const result = await api.submit(signedXdr);
      if (result.status !== "SUCCESS") {
        throw new Error(`Transaction failed: ${result.status}`);
      }
      onAction();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleAction(action: string) {
    if (!address) return;
    switch (action) {
      case "deposit":
        await buildSignAndSubmit(action, () =>
          api.build.deposit({ escrowId: escrow.escrowId, from: address }),
        );
        break;
      case "requestRelease":
        await buildSignAndSubmit(action, () =>
          api.build.requestRelease({ escrowId: escrow.escrowId, from: address }),
        );
        break;
      case "approveRelease":
        await buildSignAndSubmit(action, () =>
          api.build.approveRelease({ escrowId: escrow.escrowId, from: address }),
        );
        break;
      case "raiseDispute":
        await buildSignAndSubmit(action, () =>
          api.build.raiseDispute({ escrowId: escrow.escrowId, from: address }),
        );
        break;
      case "cancel":
        await buildSignAndSubmit(action, () =>
          api.build.cancel({ escrowId: escrow.escrowId, from: address }),
        );
        break;
      case "releaseAfterTimeout":
        await buildSignAndSubmit(action, () =>
          api.build.releaseAfterTimeout({ escrowId: escrow.escrowId, from: address }),
        );
        break;
      case "refundAfterExpiry":
        await buildSignAndSubmit(action, () =>
          api.build.refundAfterExpiry({ escrowId: escrow.escrowId, from: address }),
        );
        break;
      case "resolveDispute": {
        const tenantAmount = prompt("Tenant amount (stroops):");
        if (!tenantAmount) return;
        const landlordAmount = prompt("Landlord amount (stroops):");
        if (!landlordAmount) return;
        await buildSignAndSubmit(action, () =>
          api.build.resolveDispute({
            escrowId: escrow.escrowId,
            from: address,
            tenantAmount: tenantAmount.trim(),
            landlordAmount: landlordAmount.trim(),
          }),
        );
        break;
      }
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

      {address &&
        (canDeposit ||
          canRequestRelease ||
          canApproveRelease ||
          canRaiseDispute ||
          canCancel ||
          canReleaseAfterTimeout ||
          canRefundAfterExpiry ||
          canResolveDispute) && (
          <div className="flex flex-wrap gap-2">
            {canDeposit && (
              <Button
                onClick={() => handleAction("deposit")}
                disabled={submitting !== null}
              >
                {submitting === "deposit" ? "Submitting..." : "Deposit"}
              </Button>
            )}
            {canRequestRelease && (
              <Button
                onClick={() => handleAction("requestRelease")}
                disabled={submitting !== null}
              >
                {submitting === "requestRelease" ? "Submitting..." : "Request Release"}
              </Button>
            )}
            {canApproveRelease && (
              <Button
                onClick={() => handleAction("approveRelease")}
                disabled={submitting !== null}
              >
                {submitting === "approveRelease" ? "Submitting..." : "Approve Release"}
              </Button>
            )}
            {canReleaseAfterTimeout && (
              <Button
                onClick={() => handleAction("releaseAfterTimeout")}
                disabled={submitting !== null}
              >
                {submitting === "releaseAfterTimeout" ? "Submitting..." : "Release (Timeout)"}
              </Button>
            )}
            {canRaiseDispute && (
              <Button
                variant="danger"
                onClick={() => handleAction("raiseDispute")}
                disabled={submitting !== null}
              >
                {submitting === "raiseDispute" ? "Submitting..." : "Raise Dispute"}
              </Button>
            )}
            {canRefundAfterExpiry && (
              <Button
                onClick={() => handleAction("refundAfterExpiry")}
                disabled={submitting !== null}
              >
                {submitting === "refundAfterExpiry" ? "Submitting..." : "Refund (Expired)"}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="ghost"
                onClick={() => handleAction("cancel")}
                disabled={submitting !== null}
              >
                {submitting === "cancel" ? "Submitting..." : "Cancel"}
              </Button>
            )}
            {canResolveDispute && (
              <Button
                variant="danger"
                onClick={() => handleAction("resolveDispute")}
                disabled={submitting !== null}
              >
                {submitting === "resolveDispute" ? "Submitting..." : "Resolve Dispute"}
              </Button>
            )}
          </div>
        )}
    </Card>
  );
}
