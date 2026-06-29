export enum EscrowStatus {
  Created = "Created",
  WaitingDeposit = "WaitingDeposit",
  Locked = "Locked",
  ReleaseRequested = "ReleaseRequested",
  Completed = "Completed",
  Disputed = "Disputed",
  Resolved = "Resolved",
}

export interface Escrow {
  id: string;
  escrowId: string;
  landlord: string;
  tenant: string;
  depositAmount: string;
  token: string;
  rentalEndDate: string;
  status: EscrowStatus;
  contractId: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowChainData {
  id: string;
  landlord: string;
  tenant: string;
  deposit_amount: string;
  token: string;
  rental_end_date: string;
  status: string;
  created_at: string;
  release_requested_at: string;
  tenant_amount: string;
  landlord_amount: string;
}

export interface CreateEscrowInput {
  landlord: string;
  tenant: string;
  depositAmount: string;
  token: string;
  rentalEndDate: string;
}

export interface BuildResponse {
  xdr: string;
  contractId: string;
  networkPassphrase: string;
}

export interface SubmitResponse {
  hash: string;
  status: string;
}
