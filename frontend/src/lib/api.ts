import type { Escrow, BuildResponse, SubmitResponse, EscrowChainData } from "@/types";

const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  escrows: {
    list: () => request<Escrow[]>("/escrows"),
    get: (id: string) => request<Escrow>(`/escrows/${id}`),
    create: (data: any) =>
      request<Escrow>("/escrows", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getFromChain: (id: string) => request<EscrowChainData>(`/escrows/chain/${id}`),
    getCount: () => request<{ count: string }>("/escrows/count"),
  },

  build: {
    createEscrow: (data: any) =>
      request<BuildResponse>("/escrows/build/create-escrow", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deposit: (data: any) =>
      request<BuildResponse>("/escrows/build/deposit", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    requestRelease: (data: any) =>
      request<BuildResponse>("/escrows/build/request-release", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    approveRelease: (data: any) =>
      request<BuildResponse>("/escrows/build/approve-release", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    raiseDispute: (data: any) =>
      request<BuildResponse>("/escrows/build/raise-dispute", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    resolveDispute: (data: any) =>
      request<BuildResponse>("/escrows/build/resolve-dispute", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    releaseAfterTimeout: (data: any) =>
      request<BuildResponse>("/escrows/build/release-after-timeout", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    refundAfterExpiry: (data: any) =>
      request<BuildResponse>("/escrows/build/refund-after-expiry", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    cancel: (data: any) =>
      request<BuildResponse>("/escrows/build/cancel", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  submit: (signedXdr: string) =>
    request<SubmitResponse>("/escrows/submit", {
      method: "POST",
      body: JSON.stringify({ signedXdr }),
    }),
};
