import { Link, Navigate, useParams } from "react-router-dom";
import { findProject } from "../data/mockProjects";
import { ExternalLinkIcon } from "../diagram/icons";
import { TeamsNav } from "./TeamsNav";

// Porting di design/Dashboard.dc.html, meno il riquadro "Assistente documenti": quella è la chat
// contestuale del punto 9 del piano, non ancora implementata. Diagrammi e documenti sono dati finti
// (vedi src/data/mockProjects.ts) finché non ci sono un vero backend (punto 3+) e Microsoft Graph (punto 6).
export function ProjectDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = projectId ? findProject(projectId) : undefined;

  if (!project) return <Navigate to="/" replace />;

  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateColumns: "68px minmax(0,1fr)", background: "var(--paper)", color: "var(--ink)", fontFamily: "'Source Sans 3','Segoe UI',system-ui,sans-serif", fontSize: 15, lineHeight: 1.45 }}>
      <TeamsNav />
      <div style={{ display: "grid", gridTemplateRows: "auto minmax(0,1fr)", minWidth: 0 }}>
        <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 24px", height: 56, borderBottom: "1px solid var(--rule)", background: "var(--card)" }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 13 }}>
            {project.mono}
          </span>
          <Link to="/" style={{ fontWeight: 700, color: "var(--ink)", textDecoration: "none" }}>
            {project.name}
          </Link>
          <span style={{ color: "var(--muted)" }}>›</span>
          <span style={{ color: "var(--muted)" }}>Generale</span>
          <div role="tablist" aria-label="Schede del canale" style={{ display: "flex", gap: 4, marginLeft: 16, alignSelf: "stretch" }}>
            {["Post", "File", "Note"].map((t) => (
              <button key={t} type="button" role="tab" disabled style={{ border: 0, background: "transparent", padding: "0 12px", color: "var(--muted)", cursor: "default", borderBottom: "3px solid transparent" }}>
                {t}
              </button>
            ))}
            <button type="button" role="tab" aria-selected="true" style={{ border: 0, background: "transparent", padding: "0 12px", fontWeight: 700, cursor: "default", color: "var(--ink)", borderBottom: "3px solid var(--accent)" }}>
              Architettura
            </button>
          </div>
        </header>
        <main style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20, minWidth: 0, overflow: "auto" }}>
          <section aria-label="Informazioni di progetto" style={{ display: "flex", gap: 18, alignItems: "center", paddingBottom: 20, borderBottom: "3px solid var(--accent)" }}>
            <span style={{ width: 72, height: 72, borderRadius: 14, background: "var(--accent-soft)", color: "var(--accent-ink)", display: "grid", placeItems: "center", fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 28, flex: "none" }}>
              {project.mono}
            </span>
            <div style={{ flex: 1, display: "grid", gap: 4, minWidth: 0 }}>
              <div style={{ fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--accent-ink)" }}>Progetto · team Teams sincronizzato</div>
              <h1 style={{ margin: 0, fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.1 }}>{project.fullName}</h1>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", fontSize: 14, color: "var(--muted)" }}>
                <span>Cliente: {project.client}</span>
                <span>BU: {project.bu}</span>
                <span>Solution Architect: {project.architect}</span>
                <span>
                  Il tuo ruolo: <strong style={{ color: "var(--ink)" }}>{project.role}</strong>
                </span>
              </div>
            </div>
          </section>

          <section aria-labelledby="h-diag" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h2 id="h-diag" style={{ margin: 0, flex: 1, fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 20 }}>
                Diagrammi architetturali
              </h2>
              <button type="button" disabled title="Non ancora disponibile" style={{ border: 0, borderRadius: 8, height: 36, padding: "0 14px", background: "var(--ink)", color: "var(--paper)", fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.5, cursor: "default" }}>
                Nuovo diagramma
              </button>
            </div>
            <div style={{ border: "1px solid var(--rule)", borderRadius: 10, background: "var(--card)", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 150px 90px 70px 140px", gap: 12, padding: "10px 16px", background: "var(--panel)", fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)" }}>
                <span>Diagramma</span>
                <span>Livello C4</span>
                <span>Versione</span>
                <span>ADR</span>
                <span>Aggiornato</span>
              </div>
              {project.diagrams.map((d) => {
                const row = (
                  <>
                    <span style={{ display: "grid", minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>{d.name}</span>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>{d.sub}</span>
                    </span>
                    <span style={{ fontSize: 14 }}>{d.level}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "var(--accent-ink)" }}>{d.ver}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>{d.adr}</span>
                    <span style={{ fontSize: 14, color: "var(--muted)" }}>{d.updated}</span>
                  </>
                );
                const rowStyle = { display: "grid", gridTemplateColumns: "minmax(0,1fr) 150px 90px 70px 140px", gap: 12, alignItems: "center", padding: "12px 16px", borderTop: "1px solid var(--rule)" } as const;
                return d.hasData ? (
                  <Link key={d.id} to={`/progetti/${project.id}/diagrammi/${d.id}`} style={{ ...rowStyle, color: "var(--ink)", textDecoration: "none" }}>
                    {row}
                  </Link>
                ) : (
                  <div key={d.id} title="Dati non ancora disponibili" style={{ ...rowStyle, color: "var(--muted)", opacity: 0.6, cursor: "default" }}>
                    {row}
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="h-doc" style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <h2 id="h-doc" style={{ margin: 0, flex: 1, fontFamily: "'Barlow Semi Condensed',sans-serif", fontWeight: 700, fontSize: 20 }}>
                Documenti di progetto
              </h2>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Letti dal sito SharePoint e da OneNote del team · collegamento non ancora attivo</span>
            </div>
            {project.docs.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
                {project.docs.map((doc, i) => (
                  <div key={i} title="Non ancora collegato a SharePoint/OneNote" style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 12px", border: "1px solid var(--rule)", borderRadius: 8, background: "var(--card)", color: "var(--muted)" }}>
                    <span style={{ width: 34, height: 34, borderRadius: 6, background: "var(--panel)", display: "grid", placeItems: "center", fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fontWeight: 500, color: "var(--muted)", flex: "none" }}>{doc.ext}</span>
                    <span style={{ display: "grid", minWidth: 0, flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.name}</span>
                      <span style={{ fontSize: 12.5 }}>{doc.where}</span>
                    </span>
                    <ExternalLinkIcon size={14} style={{ color: "var(--muted)", flex: "none" }} />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>Nessun documento ancora collegato per questo progetto.</p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
