import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { api } from "@/lib/api";
import { signTransaction } from "@/lib/wallet";
import { useWallet } from "@/providers/WalletProvider";
import type { CreateEscrowInput } from "@/types";

interface Props {
  onCreated: () => void;
}

export function CreateEscrowForm({ onCreated }: Props) {
  const { address } = useWallet();
  const [form, setForm] = useState<CreateEscrowInput>({
    landlord: "",
    tenant: "",
    depositAmount: "",
    token: "",
    rentalEndDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...form,
        landlord: form.landlord || address,
        depositAmount: form.depositAmount,
        rentalEndDate: form.rentalEndDate,
      };

      // 1. Build unsigned XDR
      const { xdr, networkPassphrase } = await api.build.createEscrow(payload);

      // 2. Sign with wallet
      const signedXdr = await signTransaction(xdr, { networkPassphrase });

      // 3. Submit to chain
      const result = await api.submit(signedXdr);
      if (result.status !== "SUCCESS") {
        throw new Error(`Transaction failed: ${result.status}`);
      }

      // 4. Save locally so it appears in the list
      await api.escrows.create(payload);

      setForm({ landlord: "", tenant: "", depositAmount: "", token: "", rentalEndDate: "" });
      onCreated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card title="Create Escrow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Landlord Address"
            value={form.landlord}
            onChange={(v) => setForm((f) => ({ ...f, landlord: v }))}
            placeholder={address || ""}
          />
          <InputField
            label="Tenant Address"
            value={form.tenant}
            onChange={(v) => setForm((f) => ({ ...f, tenant: v }))}
            required
          />
          <InputField
            label="Deposit Amount (stroops)"
            value={form.depositAmount}
            onChange={(v) => setForm((f) => ({ ...f, depositAmount: v }))}
            type="number"
            required
          />
          <InputField
            label="Token Contract Address"
            value={form.token}
            onChange={(v) => setForm((f) => ({ ...f, token: v }))}
            required
          />
          <InputField
            label="Rental End Date (timestamp)"
            value={form.rentalEndDate}
            onChange={(v) => setForm((f) => ({ ...f, rentalEndDate: v }))}
            type="number"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/50 rounded-lg px-3 py-2">{error}</p>
        )}

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button type="submit" disabled={submitting || !address} className="w-full">
            {submitting ? "Submitting..." : "Create Escrow"}
          </Button>
        </motion.div>
      </form>
    </Card>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-indigo-500"
      />
    </label>
  );
}
