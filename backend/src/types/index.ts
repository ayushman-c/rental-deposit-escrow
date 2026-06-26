export interface CreateEscrowRequest {
  landlord: string;
  tenant: string;
  depositAmount: string;
  token: string;
  rentalEndDate: string;
}

export interface DepositRequest {
  escrowId: string;
  from: string;
}

export interface RequestReleaseRequest {
  escrowId: string;
  from: string;
}

export interface ApproveReleaseRequest {
  escrowId: string;
  from: string;
}

export interface RaiseDisputeRequest {
  escrowId: string;
  from: string;
}

export interface ResolveDisputeRequest {
  escrowId: string;
  from: string;
  tenantAmount: string;
  landlordAmount: string;
}

export interface CancelEscrowRequest {
  escrowId: string;
  from: string;
}

export interface EscrowResponse {
  id: string;
  escrowId: string;
  landlord: string;
  tenant: string;
  depositAmount: string;
  token: string;
  rentalEndDate: string;
  status: string;
  contractId: string;
  createdAt: string;
  updatedAt: string;
}
