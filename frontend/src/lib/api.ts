const API_BASE = "/api";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
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
    list: () => request<any[]>("/escrows"),
    get: (id: string) => request<any>(`/escrows/${id}`),
    create: (data: any) =>
      request<any>("/escrows", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    deposit: (data: any) =>
      request<any>("/escrows/deposit", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    requestRelease: (data: any) =>
      request<any>("/escrows/request-release", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    approveRelease: (data: any) =>
      request<any>("/escrows/approve-release", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    raiseDispute: (data: any) =>
      request<any>("/escrows/raise-dispute", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    resolveDispute: (data: any) =>
      request<any>("/escrows/resolve-dispute", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    cancel: (data: any) =>
      request<any>("/escrows/cancel", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};
