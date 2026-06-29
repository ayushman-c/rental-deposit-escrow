import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  soroban: {
    contractId: process.env.SOROBAN_CONTRACT_ID || "",
    networkPassphrase: process.env.SOROBAN_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
    rpcUrl: process.env.SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  },
};
