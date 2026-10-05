import { useEffect, useState } from "react";
import { getTeamsSsoToken } from "./teamsAuth";

export interface MeProfile {
  displayName: string;
  mail: string | null;
  joinedTeamsCount: number;
}

export type MeStatus = "loading" | "ready" | "unavailable" | "error";

export interface MeState {
  status: MeStatus;
  profile: MeProfile | null;
  error?: string;
}

const API_BASE = (import.meta.env.VITE_API_ENDPOINT as string | undefined) ?? "http://localhost:7071/api";

// Prova a ottenere il profilo dell'utente (via SSO Teams → scambio on-behalf-of nel backend → Graph
// /me, vedi api/src/functions/me.ts). "unavailable" (non "error") quando semplicemente non siamo
// dentro Teams: è lo stato atteso in modalità browser standalone, non un guasto da segnalare.
export function useMe(): MeState {
  const [state, setState] = useState<MeState>({ status: "loading", profile: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getTeamsSsoToken();
      if (!token) {
        if (!cancelled) setState({ status: "unavailable", profile: null });
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as MeProfile;
        if (!cancelled) setState({ status: "ready", profile: data });
      } catch (err) {
        if (!cancelled) setState({ status: "error", profile: null, error: err instanceof Error ? err.message : String(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
