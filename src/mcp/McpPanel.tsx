import { useEffect, useState, type CSSProperties } from "react";
import type { McpStatus } from "./types";

interface Props {
  onClose: () => void;
}

const LOCAL_URL = (port: number) => `http://127.0.0.1:${port}/mcp`;

export function McpPanel({ onClose }: Props) {
  const api = window.atlasDesktop?.mcp;
  const [status, setStatus] = useState<McpStatus | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    void api.status().then(setStatus);
    return api.onState(setStatus);
  }, [api]);

  if (!api || !status) return null;

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operazione non riuscita.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const toggleToken = () =>
    run(async () => {
      if (token) setToken(null);
      else setToken(await api.getToken());
    });

  const regenerateToken = () =>
    run(async () => {
      setToken(await api.regenerateToken());
      setStatus(await api.status());
    });

  const mcpLocalUrl = LOCAL_URL(status.port);
  const mcpPublicUrl = status.tunnelUrl ? `${status.tunnelUrl}/mcp` : null;

  return (
    <div style={panel} role="dialog" aria-label="Assistente esterno MCP">
      <div style={header}>
        <strong style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontSize: 16 }}>Assistente esterno (MCP)</strong>
        <button onClick={onClose} aria-label="Chiudi" style={closeBtn}>
          ✕
        </button>
      </div>

      <section style={section}>
        <div style={label}>Server locale</div>
        <div style={row}>
          <span style={{ color: status.running ? "var(--accent-ink)" : "var(--muted)", fontSize: 13.5 }}>
            {status.running ? `Attivo su ${mcpLocalUrl}` : "Spento"}
          </span>
          <button disabled={busy} onClick={() => run(() => (status.running ? api.stop() : api.start()).then(setStatus))} style={button}>
            {status.running ? "Ferma" : "Avvia"}
          </button>
        </div>
        <label style={checkRow}>
          <input
            type="checkbox"
            checked={status.writeEnabled}
            disabled={busy}
            onChange={(e) => run(() => api.setWriteEnabled(e.target.checked).then(setStatus))}
          />
          Consenti modifiche al diagramma (default: solo lettura)
        </label>
      </section>

      <section style={section}>
        <div style={label}>Token di accesso</div>
        <div style={row}>
          <button disabled={busy} onClick={toggleToken} style={button}>
            {token ? "Nascondi token" : "Mostra token"}
          </button>
          <button disabled={busy} onClick={regenerateToken} style={button}>
            Rigenera
          </button>
        </div>
        {token && (
          <div style={tokenBox}>
            <code style={{ fontSize: 12, wordBreak: "break-all" }}>{token}</code>
            <button onClick={() => copy("token", token)} style={button}>
              {copied === "token" ? "Copiato" : "Copia"}
            </button>
          </div>
        )}
      </section>

      <section style={section}>
        <div style={label}>Tunnel pubblico (devtunnel)</div>
        {!status.tunnelRunning ? (
          <button disabled={busy || !status.running} onClick={() => run(() => api.tunnelStart().then(setStatus))} style={button}>
            Avvia tunnel
          </button>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {mcpPublicUrl ? (
              <div style={tokenBox}>
                <code style={{ fontSize: 12, wordBreak: "break-all" }}>{mcpPublicUrl}</code>
                <button onClick={() => copy("url", mcpPublicUrl)} style={button}>
                  {copied === "url" ? "Copiato" : "Copia"}
                </button>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Avvio del tunnel in corso…</span>
            )}
            <button disabled={busy} onClick={() => run(() => api.tunnelStop().then(setStatus))} style={button}>
              Ferma tunnel
            </button>
          </div>
        )}
        <p style={warning}>
          Con il tunnel attivo, chiunque abbia l'URL e il token può leggere il diagramma aperto e, se hai attivato le modifiche, modificarlo.
          Condividi il tunnel solo con client di cui ti fidi e fermalo quando non serve.
        </p>
      </section>

      {(error || status.tunnelError) && <div style={errorBox}>{error ?? status.tunnelError}</div>}
    </div>
  );
}

const panel: CSSProperties = {
  position: "fixed",
  top: 90,
  right: 20,
  width: 380,
  zIndex: 20,
  background: "var(--card)",
  border: "1px solid var(--rule)",
  borderRadius: 10,
  boxShadow: "0 12px 32px rgba(0,0,0,.25)",
  padding: 16,
  display: "grid",
  gap: 14,
  color: "var(--ink)",
  fontSize: 13.5,
};

const header: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between" };
const section: CSSProperties = { display: "grid", gap: 8, borderTop: "1px solid var(--rule)", paddingTop: 12 };
const label: CSSProperties = {
  fontFamily: "'Barlow Semi Condensed',sans-serif",
  fontWeight: 600,
  fontSize: 12,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  color: "var(--accent-ink)",
};
const row: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" };
const checkRow: CSSProperties = { display: "flex", alignItems: "center", gap: 8, fontSize: 13 };
const tokenBox: CSSProperties = { display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", background: "var(--panel)", padding: 8, borderRadius: 6 };
const warning: CSSProperties = { margin: 0, fontSize: 12, color: "var(--muted)" };
const errorBox: CSSProperties = { fontSize: 13, color: "var(--accent-ink)", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: 6, padding: "6px 10px" };

const button: CSSProperties = {
  border: "1px solid var(--rule)",
  borderRadius: 6,
  padding: "5px 12px",
  fontSize: 13,
  background: "var(--paper)",
  color: "var(--ink)",
  cursor: "pointer",
};

const closeBtn: CSSProperties = { border: 0, background: "transparent", color: "var(--ink)", cursor: "pointer", fontSize: 14 };
