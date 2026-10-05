import { useMemo, useState, type CSSProperties } from "react";
import type { Entity, Technology } from "../types/diagram";
import { ICON_CATALOG, SEARCHABLE_ICONS, resolveIconUrl } from "./iconCatalog";
import { monogram, slugify, uniqueId } from "./ids";

const MAX_SEARCH_RESULTS = 60;

const label: CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" };

export interface NewTechnology {
  id: string;
  g: string;
  n: string;
  icon?: string;
  d: string;
}

export function IconPicker({ value, onChange }: { value: string | undefined; onChange: (icon: string | undefined) => void }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (q.length < 2) return [];
    return SEARCHABLE_ICONS.filter((icon) => icon.label.toLowerCase().includes(q) || icon.id.toLowerCase().includes(q)).slice(0, MAX_SEARCH_RESULTS);
  }, [q]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={label}>Icona</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <button type="button" title="Nessuna (monogramma)" onClick={() => onChange(undefined)} style={iconBtn(value === undefined)}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--muted)" }}>Aa</span>
          </button>
          {ICON_CATALOG.map((icon) => (
            <button key={icon.id} type="button" title={icon.label} onClick={() => onChange(icon.id)} style={iconBtn(value === icon.id)}>
              <img src={resolveIconUrl(icon.id)} alt="" style={{ width: 18, height: 18, display: "block" }} />
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca tra altre icone… (es. azure sql, kubernetes, github)"
          style={{ border: "1px solid var(--rule)", borderRadius: 6, padding: "6px 8px", fontSize: 13, background: "var(--paper)", color: "var(--ink)", font: "inherit" }}
        />
        {q.length < 2 ? (
          <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{SEARCHABLE_ICONS.length} icone aggiuntive disponibili, digita per cercare</span>
        ) : results.length === 0 ? (
          <span style={{ fontSize: 11.5, color: "var(--muted)" }}>Nessun risultato</span>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {results.map((icon) => (
              <button key={icon.id} type="button" title={icon.label} onClick={() => onChange(icon.id)} style={iconBtn(value === icon.id)}>
                <img src={resolveIconUrl(icon.id)} alt="" style={{ width: 18, height: 18, display: "block" }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function iconBtn(active: boolean): CSSProperties {
  return {
    width: 30,
    height: 30,
    display: "grid",
    placeItems: "center",
    border: active ? "1.5px solid var(--accent)" : "1px solid var(--rule)",
    borderRadius: 6,
    background: active ? "var(--accent-soft)" : "var(--paper)",
    cursor: "pointer",
  };
}

export function EntityPicker({ entities, selected, onToggle }: { entities: Entity[]; selected: Set<string>; onToggle: (id: string) => void }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <span style={label}>Entità collegate</span>
      {entities.length === 0 && <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)" }}>Nessuna entità nel diagramma.</p>}
      <div style={{ display: "grid", gap: 2, maxHeight: 220, overflowY: "auto" }}>
        {entities.map((e) => (
          <label key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "4px 2px", cursor: "pointer" }}>
            <input type="checkbox" checked={selected.has(e.id)} onChange={() => onToggle(e.id)} />
            {e.icon ? <img src={resolveIconUrl(e.icon)} alt="" style={{ width: 16, height: 16, display: "block" }} /> : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--muted)" }}>{e.mono ?? monogram(e.n)}</span>}
            {e.n}
          </label>
        ))}
      </div>
    </div>
  );
}

export function TechnologyPicker({
  technologies,
  selected,
  onToggle,
  pending,
  onAddPending,
  onRemovePending,
}: {
  technologies: Technology[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  pending: NewTechnology[];
  onAddPending: (tech: NewTechnology) => void;
  onRemovePending: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [nome, setNome] = useState("");
  const [icon, setIcon] = useState<string | undefined>(undefined);

  const confirmAdd = () => {
    const n = nome.trim();
    if (!n) return;
    const existingIds = [...technologies.map((t) => t.id), ...pending.map((t) => t.id)];
    const id = uniqueId(slugify(n), (candidate) => existingIds.includes(candidate));
    onAddPending({ id, g: "Tecnologie", n, icon, d: "" });
    setNome("");
    setIcon(undefined);
    setAdding(false);
  };

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <span style={label}>Tecnologie</span>
      {technologies.length === 0 && pending.length === 0 && <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)" }}>Nessuna tecnologia nel diagramma.</p>}
      <div style={{ display: "grid", gap: 2, maxHeight: 140, overflowY: "auto" }}>
        {technologies.map((t) => (
          <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "4px 2px", cursor: "pointer" }}>
            <input type="checkbox" checked={selected.has(t.id)} onChange={() => onToggle(t.id)} />
            {t.icon ? <img src={resolveIconUrl(t.icon)} alt="" style={{ width: 16, height: 16, display: "block" }} /> : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--muted)" }}>{t.mono ?? monogram(t.n)}</span>}
            {t.n}
          </label>
        ))}
        {pending.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "4px 2px" }}>
            <input type="checkbox" checked readOnly />
            {t.icon ? <img src={resolveIconUrl(t.icon)} alt="" style={{ width: 16, height: 16, display: "block" }} /> : <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: "var(--muted)" }}>{monogram(t.n)}</span>}
            <span style={{ flex: 1 }}>{t.n}</span>
            <span style={{ fontSize: 11, color: "var(--accent-ink)" }}>nuova</span>
            <button type="button" onClick={() => onRemovePending(t.id)} style={{ border: 0, background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 13 }}>
              ✕
            </button>
          </div>
        ))}
      </div>
      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} style={{ border: "1px dashed var(--rule)", borderRadius: 6, padding: "6px 10px", fontSize: 12.5, background: "transparent", color: "var(--accent-ink)", cursor: "pointer", justifySelf: "start" }}>
          + Nuova tecnologia
        </button>
      ) : (
        <div style={{ display: "grid", gap: 6, border: "1px solid var(--rule)", borderRadius: 6, padding: 8 }}>
          <input
            autoFocus
            placeholder="Nome tecnologia"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={{ border: "1px solid var(--rule)", borderRadius: 6, padding: "5px 8px", fontSize: 13, background: "var(--paper)", color: "var(--ink)", font: "inherit" }}
          />
          <IconPicker value={icon} onChange={setIcon} />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setAdding(false)} style={{ border: "1px solid var(--rule)", borderRadius: 6, padding: "5px 10px", fontSize: 12.5, background: "var(--paper)", cursor: "pointer", color: "var(--ink)" }}>
              Annulla
            </button>
            <button
              type="button"
              disabled={!nome.trim()}
              onClick={confirmAdd}
              style={{ border: 0, borderRadius: 6, padding: "5px 10px", fontSize: 12.5, background: "var(--accent)", color: "#fff", cursor: nome.trim() ? "pointer" : "default", opacity: nome.trim() ? 1 : 0.5, fontWeight: 600 }}
            >
              Aggiungi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
