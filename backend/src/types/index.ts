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

export interface ReleaseAfterTimeoutRequest {
  escrowId: string;
  from: string;
}

export interface RefundAfterExpiryRequest {
  escrowId: string;
  from: string;
}

export interface CancelEscrowRequest {
  escrowId: string;
  from: string;
}

export interface BuildResponse {
  xdr: string;
  contractId: string;
  networkPassphrase: string;
}

export interface SubmitRequest {
  signedXdr: string;
}

export interface SubmitResponse {
  hash: string;
  status: string;
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
