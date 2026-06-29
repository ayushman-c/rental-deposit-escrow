import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/auth";
import { AppError } from "./errorHandler";

declare global {
  namespace Express {
    interface Request {
      userAddress?: string;
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "Missing or invalid authorization header"));
  }

  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return next(new AppError(401, "Invalid or expired token"));
  }

  req.userAddress = payload.address;
  next();
}
