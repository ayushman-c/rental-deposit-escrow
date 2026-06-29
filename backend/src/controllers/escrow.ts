import { Request, Response, NextFunction } from "express";
import * as escrowService from "../services/escrow";
import { AppError } from "../middleware/errorHandler";
import { sorobanService } from "../services/soroban";
import {
  CreateEscrowRequest,
  DepositRequest,
  RequestReleaseRequest,
  ApproveReleaseRequest,
  RaiseDisputeRequest,
  ResolveDisputeRequest,
  ReleaseAfterTimeoutRequest,
  RefundAfterExpiryRequest,
  CancelEscrowRequest,
  BuildResponse,
  SubmitRequest,
  SubmitResponse,
  EscrowResponse,
  EscrowChainData,
} from "../types";
import { Address, nativeToScVal } from "@stellar/stellar-sdk";
import { xdr } from "@stellar/stellar-sdk";

function u64ScVal(value: string | bigint): xdr.ScVal {
  return nativeToScVal(BigInt(value), { type: "u64" });
}

function i128ScVal(value: string | bigint): xdr.ScVal {
  return nativeToScVal(BigInt(value), { type: "i128" });
}

function addressScVal(address: string): xdr.ScVal {
  return new Address(address).toScVal();
}

// ── Build endpoints (return unsigned XDR) ──

export async function buildCreateEscrow(
  req: Request<{}, {}, CreateEscrowRequest>,
  res: Response<BuildResponse>,
  next: NextFunction,
) {
  try {
    const { landlord, tenant, depositAmount, token, rentalEndDate } = req.body;
    if (!landlord || !tenant || !depositAmount || !token || !rentalEndDate) {
      throw new AppError(400, "Missing required fields");
    }

    const source = landlord;
    const xdr = await sorobanService.buildTransaction({
      source,
      method: "create_escrow",
      args: [
        addressScVal(landlord),
        addressScVal(tenant),
        i128ScVal(depositAmount),
        addressScVal(token),
        u64ScVal(rentalEndDate),
      ],
    });

    res.json({ xdr, contractId: sorobanService.getContractId(), networkPassphrase: "Test SDF Network ; September 2015" });
  } catch (err) {
    next(err);
  }
}

export async function buildDeposit(
  req: Request<{}, {}, DepositRequest>,
  res: Response<BuildResponse>,
  next: NextFunction,
) {
  try {
    const { escrowId, from } = req.body;
    if (!escrowId || !from) throw new AppError(400, "escrowId and from are required");

    const xdr = await sorobanService.buildTransaction({
      source: from,
      method: "deposit",
      args: [u64ScVal(escrowId), addressScVal(from)],
    });

    res.json({ xdr, contractId: sorobanService.getContractId(), networkPassphrase: "Test SDF Network ; September 2015" });
  } catch (err) {
    next(err);
  }
}

export async function buildRequestRelease(
  req: Request<{}, {}, RequestReleaseRequest>,
  res: Response<BuildResponse>,
  next: NextFunction,
) {
  try {
    const { escrowId, from } = req.body;
    if (!escrowId || !from) throw new AppError(400, "escrowId and from are required");

    const xdr = await sorobanService.buildTransaction({
      source: from,
      method: "request_release",
      args: [u64ScVal(escrowId), addressScVal(from)],
    });

    res.json({ xdr, contractId: sorobanService.getContractId(), networkPassphrase: "Test SDF Network ; September 2015" });
  } catch (err) {
    next(err);
  }
}

export async function buildApproveRelease(
  req: Request<{}, {}, ApproveReleaseRequest>,
  res: Response<BuildResponse>,
  next: NextFunction,
) {
  try {
    const { escrowId, from } = req.body;
    if (!escrowId || !from) throw new AppError(400, "escrowId and from are required");

    const xdr = await sorobanService.buildTransaction({
      source: from,
      method: "approve_release",
      args: [u64ScVal(escrowId), addressScVal(from)],
    });

    res.json({ xdr, contractId: sorobanService.getContractId(), networkPassphrase: "Test SDF Network ; September 2015" });
  } catch (err) {
    next(err);
  }
}

export async function buildRaiseDispute(
  req: Request<{}, {}, RaiseDisputeRequest>,
  res: Response<BuildResponse>,
  next: NextFunction,
) {
  try {
    const { escrowId, from } = req.body;
    if (!escrowId || !from) throw new AppError(400, "escrowId and from are required");

    const xdr = await sorobanService.buildTransaction({
      source: from,
      method: "raise_dispute",
      args: [u64ScVal(escrowId), addressScVal(from)],
    });

    res.json({ xdr, contractId: sorobanService.getContractId(), networkPassphrase: "Test SDF Network ; September 2015" });
  } catch (err) {
    next(err);
  }
}

export async function buildResolveDispute(
  req: Request<{}, {}, ResolveDisputeRequest>,
  res: Response<BuildResponse>,
  next: NextFunction,
) {
  try {
    const { escrowId, from, tenantAmount, landlordAmount } = req.body;
    if (!escrowId || !from || !tenantAmount || !landlordAmount) {
      throw new AppError(400, "escrowId, from, tenantAmount, and landlordAmount are required");
    }

    const xdr = await sorobanService.buildTransaction({
      source: from,
      method: "resolve_dispute",
      args: [
        u64ScVal(escrowId),
        addressScVal(from),
        i128ScVal(tenantAmount),
        i128ScVal(landlordAmount),
      ],
    });

    res.json({ xdr, contractId: sorobanService.getContractId(), networkPassphrase: "Test SDF Network ; September 2015" });
  } catch (err) {
    next(err);
  }
}

export async function buildReleaseAfterTimeout(
  req: Request<{}, {}, ReleaseAfterTimeoutRequest>,
  res: Response<BuildResponse>,
  next: NextFunction,
) {
  try {
    const { escrowId, from } = req.body;
    if (!escrowId || !from) throw new AppError(400, "escrowId and from are required");

    const xdr = await sorobanService.buildTransaction({
      source: from,
      method: "release_after_timeout",
      args: [u64ScVal(escrowId), addressScVal(from)],
    });

    res.json({ xdr, contractId: sorobanService.getContractId(), networkPassphrase: "Test SDF Network ; September 2015" });
  } catch (err) {
    next(err);
  }
}

export async function buildRefundAfterExpiry(
  req: Request<{}, {}, RefundAfterExpiryRequest>,
  res: Response<BuildResponse>,
  next: NextFunction,
) {
  try {
    const { escrowId, from } = req.body;
    if (!escrowId || !from) throw new AppError(400, "escrowId and from are required");

    const xdr = await sorobanService.buildTransaction({
      source: from,
      method: "refund_after_expiry",
      args: [u64ScVal(escrowId), addressScVal(from)],
    });

    res.json({ xdr, contractId: sorobanService.getContractId(), networkPassphrase: "Test SDF Network ; September 2015" });
  } catch (err) {
    next(err);
  }
}

export async function buildCancel(
  req: Request<{}, {}, CancelEscrowRequest>,
  res: Response<BuildResponse>,
  next: NextFunction,
) {
  try {
    const { escrowId, from } = req.body;
    if (!escrowId || !from) throw new AppError(400, "escrowId and from are required");

    const xdr = await sorobanService.buildTransaction({
      source: from,
      method: "cancel",
      args: [u64ScVal(escrowId), addressScVal(from)],
    });

    res.json({ xdr, contractId: sorobanService.getContractId(), networkPassphrase: "Test SDF Network ; September 2015" });
  } catch (err) {
    next(err);
  }
}

// ── Submit endpoint ──

export async function submitTransaction(
  req: Request<{}, {}, SubmitRequest>,
  res: Response<SubmitResponse>,
  next: NextFunction,
) {
  try {
    const { signedXdr } = req.body;
    if (!signedXdr) throw new AppError(400, "signedXdr is required");

    const result = await sorobanService.submitTransaction(signedXdr);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// ── Read endpoints ──

export async function getEscrowFromChain(
  req: Request<{ id: string }>,
  res: Response<EscrowChainData>,
  next: NextFunction,
) {
  try {
    const escrowId = req.params.id;
    if (!escrowId) throw new AppError(400, "escrowId is required");

    const data = await sorobanService.simulateRead<EscrowChainData>({
      method: "get_escrow",
      args: [u64ScVal(escrowId)],
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getEscrowCount(
  _req: Request,
  res: Response<{ count: string }>,
  next: NextFunction,
) {
  try {
    const count = await sorobanService.simulateRead<string>({
      method: "get_escrow_count",
      args: [],
    });

    res.json({ count });
  } catch (err) {
    next(err);
  }
}

// ── Legacy CRUD endpoints (local DB) ──

export async function createEscrow(
  req: Request<{}, {}, CreateEscrowRequest>,
  res: Response<EscrowResponse>,
  next: NextFunction,
) {
  try {
    const { landlord, tenant, depositAmount, token, rentalEndDate } = req.body;

    if (!landlord || !tenant || !depositAmount || !token || !rentalEndDate) {
      throw new AppError(400, "Missing required fields");
    }

    const record = await escrowService.createEscrowRecord({
      escrowId: BigInt(Date.now()),
      landlord,
      tenant,
      depositAmount: BigInt(depositAmount),
      token,
      rentalEndDate: BigInt(rentalEndDate),
      contractId: sorobanService.getContractId(),
    });

    res.status(201).json(record);
  } catch (err) {
    next(err);
  }
}

export async function getEscrow(
  req: Request<{ id: string }>,
  res: Response<EscrowResponse>,
  next: NextFunction,
) {
  try {
    const record = await escrowService.getEscrowRecord(req.params.id);
    if (!record) {
      throw new AppError(404, "Escrow not found");
    }
    res.json(record);
  } catch (err) {
    next(err);
  }
}

export async function listEscrows(
  _req: Request,
  res: Response<EscrowResponse[]>,
  next: NextFunction,
) {
  try {
    const records = await escrowService.listEscrowRecords();
    res.json(records);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(
  req: Request<{ id: string }, {}, { status: string }>,
  res: Response<EscrowResponse>,
  next: NextFunction,
) {
  try {
    const { status } = req.body;
    if (!status) throw new AppError(400, "status is required");

    const record = await escrowService.updateEscrowStatus(req.params.id, status);
    if (!record) {
      throw new AppError(404, "Escrow not found");
    }
    res.json(record);
  } catch (err) {
    next(err);
  }
}
