import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { validate } from "../middleware/validation";
import * as authController from "../controllers/auth";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

router.use(authLimiter);

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
