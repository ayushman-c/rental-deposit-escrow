import { Router } from "express";
import * as escrowController from "../controllers/escrow";

const router = Router();

// On-chain build endpoints (return unsigned XDR)
router.post("/build/create-escrow", escrowController.buildCreateEscrow);
router.post("/build/deposit", escrowController.buildDeposit);
router.post("/build/request-release", escrowController.buildRequestRelease);
router.post("/build/approve-release", escrowController.buildApproveRelease);
router.post("/build/raise-dispute", escrowController.buildRaiseDispute);
router.post("/build/resolve-dispute", escrowController.buildResolveDispute);
router.post("/build/release-after-timeout", escrowController.buildReleaseAfterTimeout);
router.post("/build/refund-after-expiry", escrowController.buildRefundAfterExpiry);
router.post("/build/cancel", escrowController.buildCancel);

// On-chain submit endpoint (accepts signed XDR)
router.post("/submit", escrowController.submitTransaction);

// On-chain read endpoints
router.get("/chain/:id", escrowController.getEscrowFromChain);
router.get("/count", escrowController.getEscrowCount);

// Local DB CRUD
router.post("/", escrowController.createEscrow);
router.get("/", escrowController.listEscrows);
router.get("/:id", escrowController.getEscrow);

export default router;
