import {
  rpc,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  xdr,
  Address,
} from "@stellar/stellar-sdk";
import { config } from "../config";

interface BuildTxParams {
  source: string;
  method: string;
  args: xdr.ScVal[];
}

interface SimulateParams {
  method: string;
  args: xdr.ScVal[];
}

export class SorobanService {
  private contractId: string;
  private networkPassphrase: string;
  private server: rpc.Server;

  constructor() {
    this.contractId = config.soroban.contractId;
    this.networkPassphrase = config.soroban.networkPassphrase;
    this.server = new rpc.Server(config.soroban.rpcUrl);
  }

  getContractId(): string {
    return this.contractId;
  }

  isConfigured(): boolean {
    return this.contractId.length > 0;
  }

  async buildTransaction(params: BuildTxParams): Promise<string> {
    const account = await this.server.getAccount(params.source);
    const contract = new Contract(this.contractId);

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(contract.call(params.method, ...params.args))
      .setTimeout(300)
      .build();

    const simulation = await this.server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation error: ${simulation.error}`);
    }

    const assembled = rpc.assembleTransaction(tx, simulation).build();
    return assembled.toXDR();
  }

  async submitTransaction(signedXdr: string): Promise<{ hash: string; status: string }> {
    const tx = TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase);

    const sendResult = await this.server.sendTransaction(tx);

    if (sendResult.status === "PENDING" || sendResult.status === "DUPLICATE") {
      let result = await this.server.getTransaction(sendResult.hash);
      let attempts = 0;
      while (result.status === "NOT_FOUND" && attempts < 30) {
        await sleep(1000);
        result = await this.server.getTransaction(sendResult.hash);
        attempts++;
      }
      return { hash: sendResult.hash, status: result.status };
    }

    if (sendResult.status === "ERROR") {
      const errorCode = sendResult.errorResult?.result()?.switch()?.name ?? "UNKNOWN";
      throw new Error(`Transaction submission error: ${errorCode}`);
    }

    return { hash: sendResult.hash, status: sendResult.status };
  }

  async simulateRead<T>(params: SimulateParams): Promise<T> {
    const contract = new Contract(this.contractId);
    const source = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAG6";

    const account = await this.server.getAccount(source);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(contract.call(params.method, ...params.args))
      .setTimeout(300)
      .build();

    const simulation = await this.server.simulateTransaction(tx);

    if (rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Simulation error: ${simulation.error}`);
    }

    if (!simulation.result) {
      throw new Error("No simulation result");
    }

    return scValToNative(simulation.result.retval) as T;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const sorobanService = new SorobanService();
