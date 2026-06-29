import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "./errorHandler";

const stellarAddress = z.string().regex(/^[G|C][0-9A-Z]{55}$/, "Invalid Stellar address");
const numericString = z.string().regex(/^\d+$/, "Must be a numeric string");
const positiveNumericString = z
  .string()
  .regex(/^[1-9]\d*$/, "Must be a positive numeric string");

export const createEscrowSchema = z.object({
  landlord: stellarAddress,
  tenant: stellarAddress,
  depositAmount: positiveNumericString,
  token: stellarAddress,
  rentalEndDate: positiveNumericString,
});

export const actionWithEscrowIdSchema = z.object({
  escrowId: positiveNumericString,
  from: stellarAddress,
});

export const resolveDisputeSchema = z.object({
  escrowId: positiveNumericString,
  from: stellarAddress,
  tenantAmount: positiveNumericString,
  landlordAmount: positiveNumericString,
});

export const submitSchema = z.object({
  signedXdr: z.string().min(1, "signedXdr is required"),
});

export const updateStatusSchema = z.object({
  status: z.string().min(1, "status is required"),
});

export function validate(schema: z.ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return next(new AppError(400, message));
    }
    req.body = result.data;
    next();
  };
}
