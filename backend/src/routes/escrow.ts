import { Router } from "express";
import * as escrowController from "../controllers/escrow";

const router = Router();

router.post("/", escrowController.createEscrow);
router.get("/", escrowController.listEscrows);
router.get("/:id", escrowController.getEscrow);
router.post("/deposit", escrowController.deposit);
router.post("/request-release", escrowController.requestRelease);
router.post("/approve-release", escrowController.approveRelease);
router.post("/raise-dispute", escrowController.raiseDispute);
router.post("/resolve-dispute", escrowController.resolveDispute);
router.post("/cancel", escrowController.cancelEscrow);

export default router;
