import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useMe } from "../auth/useMe";
import { MOCK_PROJECTS } from "../data/mockProjects";
import { SearchIcon } from "../diagram/icons";
import { TeamsNav } from "./TeamsNav";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

type Filter = "all" | "edit" | "read";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tutti" },
  { key: "edit", label: "Posso modificare" },
  { key: "read", label: "Sola lettura" },
];

// Porting di design/Main.dc.html: lista progetti (= team Teams di cui l'utente fa parte).
// Dati finti per ora (vedi src/data/mockProjects.ts); l'elenco verrà sostituito da joinedTeams via
// Microsoft Graph al punto 6 del piano in CLAUDE.md.
export function ProjectListPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const me = useMe();

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_PROJECTS.filter((p) => {
      if (filter === "edit" && !p.mine) return false;
      if (filter === "read" && p.mine) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || p.fullName.toLowerCase().includes(q);
    });
  }, [filter, query]);

  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateColumns: "68px minmax(0,1fr)", background: "var(--paper)", color: "var(--ink)", fontFamily: "'Source Sans 3','Segoe UI',system-ui,sans-serif", fontSize: 15, lineHeight: 1.45 }}>
      <TeamsNav />
      <div style={{ display: "grid", gridTemplateRows: "auto minmax(0,1fr)", minWidth: 0 }}>
        <header style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 32px", borderBottom: "3px solid var(--accent)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Semi Condensed',sans-serif", lineHeight: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 28, letterSpacing: ".02em", color: "var(--accent)" }}>Atlas</span>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: "var(--rule)" }} />
          <div style={{ flex: 1, fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent-ink)" }}>
            I miei progetti · sincronizzati dai team Teams
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{me.status === "ready" && me.profile ? me.profile.displayName : "Accesso con account aziendale"}</span>
            <span
              aria-label="Utente connesso"
              title={me.status === "error" ? `SSO non riuscito: ${me.error}` : undefined}
              style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--ink)", color: "var(--paper)", display: "grid", placeItems: "center", fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 14 }}
            >
              {me.status === "ready" && me.profile ? initialsOf(me.profile.displayName) : "[IN]"}
            </span>
          </div>
        </header>
        <main style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20, minHeight: 0, overflow: "auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
            <div style={{ flex: 1, display: "grid", gap: 4 }}>
              <h1 style={{ margin: 0, fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.1 }}>Progetti</h1>
              <p style={{ margin: 0, color: "var(--muted)" }}>Vedi i progetti dei team di cui fai parte. Un progetto corrisponde a un team.</p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--rule)", borderRadius: 8, background: "var(--card)", padding: "0 12px", height: 40, width: 320 }}>
              <SearchIcon size={16} style={{ color: "var(--muted)", flex: "none" }} />
              <span style={visuallyHidden}>Cerca progetto</span>
              <input
                type="search"
                placeholder="Cerca progetto, cliente, tecnologia"
                value={query}
                onChange={(evt) => setQuery(evt.target.value)}
                style={{ border: 0, outline: 0, flex: 1, font: "inherit", fontSize: 14, background: "transparent", color: "var(--ink)" }}
              />
            </label>
            <div role="group" aria-label="Filtro" style={{ display: "flex", gap: 2, padding: 3, borderRadius: 8, background: "var(--panel)" }}>
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  style={{
                    border: 0,
                    borderRadius: 6,
                    padding: "7px 14px",
                    fontSize: 13,
                    fontWeight: filter === f.key ? 600 : 400,
                    background: filter === f.key ? "var(--card)" : "transparent",
                    color: filter === f.key ? "var(--ink)" : "var(--muted)",
                    cursor: "pointer",
                    boxShadow: filter === f.key ? "0 1px 2px rgba(56,47,45,.15)" : "none",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {projects.map((p) => (
              <Link
                key={p.id}
                to={`/progetti/${p.id}`}
                style={{ display: "grid", gap: 14, padding: 18, border: "1px solid var(--rule)", borderRadius: 10, background: "var(--card)", color: "var(--ink)", textDecoration: "none" }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ width: 44, height: 44, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 16, flex: "none" }}>
                    {p.mono}
                  </span>
                  <span style={{ display: "grid", minWidth: 0, flex: 1 }}>
                    <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 19, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{p.client}</span>
                  </span>
                  <span style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", padding: "3px 8px", borderRadius: 999, border: "1px solid var(--rule)", color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {p.role}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 18, fontSize: 13, color: "var(--muted)", borderTop: "1px solid var(--rule)", paddingTop: 12 }}>
                  <span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, color: "var(--accent-ink)" }}>{p.diagrams.length}</span> diagrammi
                  </span>
                  <span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 500, color: "var(--accent-ink)" }}>{p.diagrams.reduce((n, d) => n + d.adr, 0)}</span> ADR
                  </span>
                  <span style={{ marginLeft: "auto" }}>{p.updated}</span>
                </div>
              </Link>
            ))}
            {projects.length === 0 && <p style={{ margin: 0, color: "var(--muted)" }}>Nessun progetto corrisponde alla ricerca.</p>}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Elenco aggiornato dall'appartenenza ai team. Il ruolo (modifica o lettura) è assegnato nel portale.</p>
        </main>
      </div>
    </div>
  );
}

const visuallyHidden: CSSProperties = { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" };
