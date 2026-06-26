import { useState, useEffect, useCallback } from "react";
import type { Escrow } from "@/types";
import { api } from "@/lib/api";

export function useEscrows() {
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.escrows.list();
      setEscrows(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { escrows, loading, error, refetch: fetch };
}

export function useEscrow(id: string | null) {
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.escrows.get(id);
      setEscrow(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { escrow, loading, error, refetch: fetch };
}
