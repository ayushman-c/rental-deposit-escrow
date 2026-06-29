import { Router } from "express";
import * as escrowController from "../controllers/escrow";
import {
  validate,
  createEscrowSchema,
  actionWithEscrowIdSchema,
  resolveDisputeSchema,
  submitSchema,
} from "../middleware/validation";
import { authenticate } from "../middleware/auth";

const router = Router();

// On-chain build endpoints (return unsigned XDR) — require auth
router.post("/build/create-escrow", authenticate, validate(createEscrowSchema), escrowController.buildCreateEscrow);
router.post("/build/deposit", authenticate, validate(actionWithEscrowIdSchema), escrowController.buildDeposit);
router.post("/build/request-release", authenticate, validate(actionWithEscrowIdSchema), escrowController.buildRequestRelease);
router.post("/build/approve-release", authenticate, validate(actionWithEscrowIdSchema), escrowController.buildApproveRelease);
router.post("/build/raise-dispute", authenticate, validate(actionWithEscrowIdSchema), escrowController.buildRaiseDispute);
router.post("/build/resolve-dispute", authenticate, validate(resolveDisputeSchema), escrowController.buildResolveDispute);
router.post("/build/release-after-timeout", authenticate, validate(actionWithEscrowIdSchema), escrowController.buildReleaseAfterTimeout);
router.post("/build/refund-after-expiry", authenticate, validate(actionWithEscrowIdSchema), escrowController.buildRefundAfterExpiry);
router.post("/build/cancel", authenticate, validate(actionWithEscrowIdSchema), escrowController.buildCancel);

// On-chain submit endpoint (accepts signed XDR)
router.post("/submit", validate(submitSchema), escrowController.submitTransaction);

// On-chain read endpoints
router.get("/chain/:id", escrowController.getEscrowFromChain);
router.get("/count", escrowController.getEscrowCount);

// Local DB CRUD
router.post("/", validate(createEscrowSchema), escrowController.createEscrow);
router.get("/", escrowController.listEscrows);
router.get("/:id", escrowController.getEscrow);

export default router;
