import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validation";
import * as authController from "../controllers/auth";

const router = Router();

const challengeSchema = z.object({
  address: z.string().min(1, "address is required"),
});

const verifySchema = z.object({
  address: z.string().min(1, "address is required"),
  signedXdr: z.string().min(1, "signedXdr is required"),
});

router.post("/challenge", validate(challengeSchema), authController.getChallenge);
router.post("/verify", validate(verifySchema), authController.verify);

export default router;
