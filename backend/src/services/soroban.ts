import { config } from "../config";

export class SorobanService {
  private contractId: string;
  private rpcUrl: string;
  private networkPassphrase: string;

  constructor() {
    this.contractId = config.soroban.contractId;
    this.rpcUrl = config.soroban.rpcUrl;
    this.networkPassphrase = config.soroban.networkPassphrase;
  }

  getContractId(): string {
    return this.contractId;
  }

  isConfigured(): boolean {
    return this.contractId.length > 0;
  }
}

export const sorobanService = new SorobanService();
