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
  CancelEscrowRequest,
  EscrowResponse,
} from "../types";

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

export async function deposit(
  req: Request<{}, {}, DepositRequest>,
  res: Response<{ message: string }>,
  next: NextFunction,
) {
  try {
    const { escrowId } = req.body;
    if (!escrowId) {
      throw new AppError(400, "escrowId is required");
    }
    res.json({ message: `Deposit initiated for escrow ${escrowId}` });
  } catch (err) {
    next(err);
  }
}

export async function requestRelease(
  req: Request<{}, {}, RequestReleaseRequest>,
  res: Response<{ message: string }>,
  next: NextFunction,
) {
  try {
    const { escrowId } = req.body;
    if (!escrowId) throw new AppError(400, "escrowId is required");
    res.json({ message: `Release requested for escrow ${escrowId}` });
  } catch (err) {
    next(err);
  }
}

export async function approveRelease(
  req: Request<{}, {}, ApproveReleaseRequest>,
  res: Response<{ message: string }>,
  next: NextFunction,
) {
  try {
    const { escrowId } = req.body;
    if (!escrowId) throw new AppError(400, "escrowId is required");
    res.json({ message: `Release approved for escrow ${escrowId}` });
  } catch (err) {
    next(err);
  }
}

export async function raiseDispute(
  req: Request<{}, {}, RaiseDisputeRequest>,
  res: Response<{ message: string }>,
  next: NextFunction,
) {
  try {
    const { escrowId } = req.body;
    if (!escrowId) throw new AppError(400, "escrowId is required");
    res.json({ message: `Dispute raised for escrow ${escrowId}` });
  } catch (err) {
    next(err);
  }
}

export async function resolveDispute(
  req: Request<{}, {}, ResolveDisputeRequest>,
  res: Response<{ message: string }>,
  next: NextFunction,
) {
  try {
    const { escrowId } = req.body;
    if (!escrowId) throw new AppError(400, "escrowId is required");
    res.json({ message: `Dispute resolved for escrow ${escrowId}` });
  } catch (err) {
    next(err);
  }
}

export async function cancelEscrow(
  req: Request<{}, {}, CancelEscrowRequest>,
  res: Response<{ message: string }>,
  next: NextFunction,
) {
  try {
    const { escrowId } = req.body;
    if (!escrowId) throw new AppError(400, "escrowId is required");
    res.json({ message: `Cancel initiated for escrow ${escrowId}` });
  } catch (err) {
    next(err);
  }
}
