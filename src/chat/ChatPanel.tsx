import { useState, type CSSProperties, type FormEvent } from "react";
import { useDiagramStore } from "../store/useDiagramStore";
import { clearStoredApiKey, readStoredApiKey, writeStoredApiKey } from "./apiKeyStore";
import { useDiagramChat } from "./useDiagramChat";

type Panel = "chat" | "history";

export function ChatPanel() {
  const [panel, setPanel] = useState<Panel>("chat");
  const versions = useDiagramStore((s) => s.versions);
  const index = useDiagramStore((s) => s.index);

  return (
    <aside aria-label="Pannello assistente e storico" style={shell}>
      <div role="tablist" style={tabBar}>
        <button type="button" role="tab" aria-selected={panel === "chat"} onClick={() => setPanel("chat")} style={tab(panel === "chat")}>
          Assistente
        </button>
        <button type="button" role="tab" aria-selected={panel === "history"} onClick={() => setPanel("history")} style={tab(panel === "history")}>
          Storico
        </button>
      </div>
      {panel === "chat" ? (
        <ChatTab />
      ) : (
        <ol style={historyList}>
          {versions
            .map((v, i) => ({ v, i }))
            .reverse()
            .map(({ v, i }) => (
              <li key={v.numero} style={{ ...historyItem, background: i === index ? "var(--accent-soft)" : "var(--card)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <span style={historyVersion}>v{v.numero}</span>
                  <span style={{ fontSize: 12.5, color: "var(--muted)", marginLeft: "auto" }}>{new Date(v.data).toLocaleString("it-IT")}</span>
                </div>
                <span style={{ fontSize: 14 }}>{v.descrizione}</span>
                <span style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  {v.origine === "chat" ? "Assistente" : v.autore}
                </span>
              </li>
            ))}
        </ol>
      )}
    </aside>
  );
}

function ChatTab() {
  const [apiKey, setApiKey] = useState<string | null>(() => readStoredApiKey());
  const [keyDraft, setKeyDraft] = useState("");
  const [changingKey, setChangingKey] = useState(false);
  const [input, setInput] = useState("");
  const { messages, pending, sendUserMessage, undoTurn } = useDiagramChat();

  const saveKey = (evt: FormEvent) => {
    evt.preventDefault();
    const trimmed = keyDraft.trim();
    if (!trimmed) return;
    writeStoredApiKey(trimmed);
    setApiKey(trimmed);
    setKeyDraft("");
    setChangingKey(false);
  };

  if (!apiKey || changingKey) {
    return (
      <form onSubmit={saveKey} style={{ padding: 16, display: "grid", gap: 10 }}>
        <p style={{ margin: 0, fontSize: 13.5 }}>Per usare l'assistente serve una chiave API Anthropic.</p>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Chiave API Anthropic</span>
          <input type="password" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} autoFocus style={keyInput} placeholder="sk-ant-…" />
        </label>
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          La chiave resta solo in questo browser (localStorage) ed è visibile a chi ha accesso agli strumenti di sviluppo di questo browser: le richieste vanno
          direttamente da qui ad Anthropic, senza un server intermedio.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {changingKey && (
            <button type="button" onClick={() => setChangingKey(false)} style={btnSecondary}>
              Annulla
            </button>
          )}
          <button type="submit" disabled={!keyDraft.trim()} style={btnPrimary(!!keyDraft.trim())}>
            Salva chiave
          </button>
        </div>
        {apiKey && !changingKey && (
          <button
            type="button"
            onClick={() => {
              clearStoredApiKey();
              setApiKey(null);
            }}
            style={{ ...btnSecondary, justifySelf: "start" }}
          >
            Rimuovi chiave salvata
          </button>
        )}
      </form>
    );
  }

  const submit = (evt: FormEvent) => {
    evt.preventDefault();
    if (!input.trim() || pending) return;
    const text = input;
    setInput("");
    void sendUserMessage(apiKey, text);
  };

  return (
    <>
      <div style={{ padding: "6px 16px 0", display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => setChangingKey(true)} style={linkBtn}>
          Cambia chiave
        </button>
      </div>
      <div style={messagesArea}>
        {messages.length === 0 && (
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>
            Descrivi una modifica al diagramma: l'assistente la applica subito, usando gli stessi comandi dell'editor manuale.
          </p>
        )}
        {messages.map((m, i) => {
          if (m.kind === "user") return <div key={i} style={bubbleUser}>{m.text}</div>;
          if (m.kind === "assistant") return <div key={i} style={bubbleAssistant}>{m.text}</div>;
          if (m.kind === "error")
            return (
              <div key={i} style={{ ...bubbleAssistant, borderColor: "#C9453A", color: "#A3361B" }}>
                {m.text}
              </div>
            );
          return (
            <div key={i} style={changesBlock}>
              <span style={{ fontWeight: 600 }}>Applicate {m.labels.length} {m.labels.length === 1 ? "modifica" : "modifiche"}</span>
              {m.labels.map((label, j) => (
                <div key={j} style={{ display: "grid", gridTemplateColumns: "22px minmax(0,1fr)", gap: 8, alignItems: "start" }}>
                  <span style={changeBullet}>+</span>
                  <span style={{ fontSize: 13.5 }}>{label}</span>
                </div>
              ))}
              <div style={{ paddingTop: 4 }}>
                <button type="button" onClick={() => undoTurn(m.undoToIndex)} style={btnSecondary}>
                  Annulla
                </button>
              </div>
            </div>
          );
        })}
        {pending && <div style={{ fontSize: 13, color: "var(--muted)" }}>L'assistente sta pensando…</div>}
      </div>
      <form onSubmit={submit} style={inputBar}>
        <label htmlFor="chat-input" style={srOnly}>
          Descrivi una modifica
        </label>
        <input
          id="chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Descrivi la modifica al diagramma…"
          disabled={pending}
          style={chatInput}
        />
        <button type="submit" aria-label="Invia" disabled={pending || !input.trim()} style={sendBtn}>
          ➤
        </button>
      </form>
    </>
  );
}

const shell: CSSProperties = { display: "flex", flexDirection: "column", minHeight: 0, height: "100%", borderLeft: "1px solid var(--rule)", background: "var(--panel)" };

const tabBar: CSSProperties = { display: "flex", padding: "0 16px", borderBottom: "1px solid var(--rule)", flex: "none" };

function tab(active: boolean): CSSProperties {
  return {
    flex: 1,
    border: 0,
    background: "transparent",
    padding: "14px 4px 11px",
    borderBottom: active ? "3px solid var(--accent)" : "3px solid transparent",
    fontFamily: "'Barlow Semi Condensed',sans-serif",
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: ".06em",
    textTransform: "uppercase",
    color: active ? "var(--ink)" : "var(--muted)",
    cursor: "pointer",
  };
}

const historyList: CSSProperties = { flex: 1, minHeight: 0, overflowY: "auto", margin: 0, padding: 12, listStyle: "none", display: "grid", alignContent: "start", gap: 6 };

const historyItem: CSSProperties = { padding: "10px 12px", borderRadius: 8, border: "1px solid var(--rule)", display: "grid", gap: 2 };

const historyVersion: CSSProperties = { fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 500, color: "var(--accent-ink)" };

const messagesArea: CSSProperties = { flex: 1, minHeight: 0, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 };

const bubbleUser: CSSProperties = { alignSelf: "flex-end", maxWidth: "88%", padding: "10px 12px", borderRadius: "10px 10px 2px 10px", background: "var(--ink)", color: "var(--paper)", fontSize: 14 };

const bubbleAssistant: CSSProperties = { padding: 12, borderRadius: "10px 10px 10px 2px", background: "var(--card)", border: "1px solid var(--rule)", fontSize: 14 };

const changesBlock: CSSProperties = { padding: 12, borderRadius: "10px 10px 10px 2px", background: "var(--card)", border: "1px solid var(--rule)", fontSize: 14, display: "grid", gap: 8 };

const changeBullet: CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "var(--accent-soft)",
  color: "var(--accent-ink)",
  display: "grid",
  placeItems: "center",
  fontFamily: "'JetBrains Mono',monospace",
  fontSize: 12,
  fontWeight: 500,
};

const inputBar: CSSProperties = { padding: "12px 16px 16px", display: "flex", gap: 8, borderTop: "1px solid var(--rule)", flex: "none" };

const chatInput: CSSProperties = { flex: 1, height: 44, border: "1px solid var(--rule)", borderRadius: 8, padding: "0 12px", font: "inherit", fontSize: 14, background: "var(--card)", color: "var(--ink)" };

const sendBtn: CSSProperties = { width: 44, height: 44, border: 0, borderRadius: 8, background: "var(--accent)", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", flex: "none" };

const keyInput: CSSProperties = { border: "1px solid var(--rule)", borderRadius: 6, padding: "6px 8px", fontSize: 13.5, background: "var(--card)", color: "var(--ink)", font: "inherit" };

const btnSecondary: CSSProperties = { border: "1px solid var(--rule)", borderRadius: 6, padding: "6px 12px", fontSize: 13, background: "var(--paper)", cursor: "pointer", color: "var(--ink)" };

function btnPrimary(enabled: boolean): CSSProperties {
  return { border: 0, borderRadius: 6, padding: "6px 12px", fontSize: 13, background: "var(--accent)", color: "#fff", cursor: enabled ? "pointer" : "default", opacity: enabled ? 1 : 0.5, fontWeight: 600 };
}

const linkBtn: CSSProperties = { border: 0, background: "transparent", color: "var(--accent-ink)", fontSize: 12.5, cursor: "pointer", padding: 0 };

const srOnly: CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" };
