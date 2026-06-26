import type { EscrowResponse } from "../types";

interface EscrowRecord {
  id: string;
  escrowId: bigint;
  landlord: string;
  tenant: string;
  depositAmount: bigint;
  token: string;
  rentalEndDate: bigint;
  status: string;
  contractId: string;
  createdAt: Date;
  updatedAt: Date;
}

const store = new Map<string, EscrowRecord>();

function toResponse(r: EscrowRecord): EscrowResponse {
  return {
    id: r.id,
    escrowId: r.escrowId.toString(),
    landlord: r.landlord,
    tenant: r.tenant,
    depositAmount: r.depositAmount.toString(),
    token: r.token,
    rentalEndDate: r.rentalEndDate.toString(),
    status: r.status,
    contractId: r.contractId,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function createEscrowRecord(data: {
  escrowId: bigint;
  landlord: string;
  tenant: string;
  depositAmount: bigint;
  token: string;
  rentalEndDate: bigint;
  contractId: string;
}): Promise<EscrowResponse> {
  const record: EscrowRecord = {
    id: crypto.randomUUID(),
    escrowId: data.escrowId,
    landlord: data.landlord,
    tenant: data.tenant,
    depositAmount: data.depositAmount,
    token: data.token,
    rentalEndDate: data.rentalEndDate,
    status: "Created",
    contractId: data.contractId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.set(record.id, record);
  return toResponse(record);
}

export async function getEscrowRecord(id: string): Promise<EscrowResponse | null> {
  const r = store.get(id);
  return r ? toResponse(r) : null;
}

export async function getEscrowRecordByChainId(escrowId: bigint): Promise<EscrowResponse | null> {
  for (const r of store.values()) {
    if (r.escrowId === escrowId) return toResponse(r);
  }
  return null;
}

export async function listEscrowRecords(): Promise<EscrowResponse[]> {
  return Array.from(store.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(toResponse);
}

export async function updateEscrowStatus(
  id: string,
  status: string,
): Promise<EscrowResponse | null> {
  const r = store.get(id);
  if (!r) return null;
  r.status = status;
  r.updatedAt = new Date();
  return toResponse(r);
}

export async function deleteEscrowRecord(id: string): Promise<void> {
  store.delete(id);
}
