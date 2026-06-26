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

export interface CreateEscrowInput {
  landlord: string;
  tenant: string;
  depositAmount: string;
  token: string;
  rentalEndDate: string;
}
