import { randomBytes, createHash } from "crypto";
import { Keypair, TransactionBuilder, Operation, Account, xdr } from "@stellar/stellar-sdk";
import jwt from "jsonwebtoken";
import { config } from "../config";

const JWT_SECRET = config.auth.jwtSecret;
const JWT_EXPIRY = "1h";
const CHALLENGE_TTL = 5 * 60 * 1000;

interface ChallengeEntry {
  nonce: string;
  address: string;
  expiresAt: number;
}

const challenges = new Map<string, ChallengeEntry>();

export function generateChallenge(address: string): string {
  const nonce = randomBytes(32).toString("hex");

  const account = new Account(address, "0");
  const tx = new TransactionBuilder(account, {
    fee: "0",
    networkPassphrase: config.soroban.networkPassphrase,
  })
    .addOperation(Operation.manageData({ name: "SorobanEscrowAuth", value: nonce }))
    .setTimeout(30)
    .build();

  const challengeXdr = tx.toEnvelope().toXDR("base64");

  challenges.set(nonce, {
    nonce,
    address,
    expiresAt: Date.now() + CHALLENGE_TTL,
  });

  return challengeXdr;
}

export function verifyChallenge(
  address: string,
  signedXdr: string,
): { valid: boolean } {
  try {
    const envelope = xdr.TransactionEnvelope.fromXDR(signedXdr, "base64");
    const envV1 = envelope.v1();
    const tx = envV1.tx();
    const signatures = envV1.signatures();

    const txBytes = tx.toXDR();
    const txHash = createHash("sha256").update(txBytes).digest();

    console.log("[auth] txHash:", txHash.toString("hex"));

    const keypair = Keypair.fromPublicKey(address);
    const hasValidSig = signatures.some((sig: xdr.DecoratedSignature) => {
      const result = keypair.verify(txHash, sig.signature());
      console.log("[auth] sig verify:", result, "sig length:", sig.signature().length);
      return result;
    });

    if (!hasValidSig) {
      console.log("[auth] No valid signature found");
      return { valid: false };
    }

    const ops = tx.operations();
    const op = ops[0];
    const opBody = op.body();

    console.log("[auth] OpType:", opBody.switch()?.name);

    if (opBody.switch() === xdr.OperationType.manageData()) {
      const manageDataOp = opBody.manageDataOp()!;
      const nonce = manageDataOp.dataValue()?.toString() ?? "";

      console.log("[auth] extracted nonce:", nonce);

      const entry = challenges.get(nonce);
      if (!entry) {
        console.log("[auth] No challenge entry found for nonce");
        return { valid: false };
      }
      if (entry.address !== address) {
        console.log("[auth] Address mismatch:", entry.address, "vs", address);
        return { valid: false };
      }
      if (Date.now() > entry.expiresAt) {
        console.log("[auth] Challenge expired");
        return { valid: false };
      }

      challenges.delete(nonce);
      return { valid: true };
    }

    console.log("[auth] Not a ManageData op");
    return { valid: false };
  } catch (err) {
    console.log("[auth] Exception:", err);
    return { valid: false };
  }
}

export function issueToken(address: string): string {
  return jwt.sign({ sub: address }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): { address: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    return { address: payload.sub };
  } catch {
    return null;
  }
}
