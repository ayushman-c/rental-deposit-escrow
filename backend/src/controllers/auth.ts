import { Request, Response, NextFunction } from "express";
import { generateChallenge, verifyChallenge, issueToken } from "../services/auth";

export function getChallenge(
  req: Request<{}, {}, { address: string }>,
  res: Response<{ challengeXdr: string }>,
  next: NextFunction,
) {
  try {
    const { address } = req.body;
    const challengeXdr = generateChallenge(address);
    res.json({ challengeXdr });
  } catch (err) {
    next(err);
  }
}

export function verify(
  req: Request<{}, {}, { address: string; signedXdr: string }>,
  res: Response<{ token: string } | { error: string }>,
  next: NextFunction,
) {
  try {
    const { address, signedXdr } = req.body;
    const result = verifyChallenge(address, signedXdr);

    if (!result.valid) {
      res.status(401).json({ error: "Invalid signature or challenge" });
      return;
    }

    const token = issueToken(address);
    res.json({ token });
  } catch (err) {
    next(err);
  }
}
