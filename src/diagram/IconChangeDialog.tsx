import { useMemo, useState, type CSSProperties } from "react";
import { SidePanel } from "./EditForms";
import { ICON_CATALOG, SEARCHABLE_ICONS, resolveIconUrl } from "./iconCatalog";

const MAX_SEARCH_RESULTS = 90;

interface Props {
  title: string;
  value: string | undefined;
  onCancel: () => void;
  onSelect: (icon: string | undefined) => void;
}

// Dialog dedicato al cambio rapido dell'icona di un'entità o tecnologia già esistente, aperto
// cliccando l'icona stessa (sul disegno o nel pannello laterale) invece che dal form "Modifica":
// tile grandi per riconoscere le icone a colpo d'occhio, a differenza dei piccoli swatch di IconPicker
// pensati per un form compatto.
export function IconChangeDialog({ title, value, onCancel, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (q.length < 2) return [];
    return SEARCHABLE_ICONS.filter((icon) => icon.label.toLowerCase().includes(q) || icon.id.toLowerCase().includes(q)).slice(0, MAX_SEARCH_RESULTS);
  }, [q]);

  return (
    <SidePanel title="Cambia icona" subtitle={title} onClose={onCancel} footer={<button onClick={onCancel} style={btnSecondary}>Chiudi</button>}>
      <div style={{ display: "grid", gap: 6 }}>
        <span style={label}>Icone principali</span>
        <div style={grid}>
          <button type="button" title="Nessuna (monogramma)" onClick={() => onSelect(undefined)} style={tile(value === undefined)}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "var(--muted)" }}>Aa</span>
            <span style={tileLabel}>Nessuna</span>
          </button>
          {ICON_CATALOG.map((icon) => (
            <button key={icon.id} type="button" title={icon.label} onClick={() => onSelect(icon.id)} style={tile(value === icon.id)}>
              <img src={resolveIconUrl(icon.id)} alt="" style={{ width: 40, height: 40, display: "block" }} />
              <span style={tileLabel}>{icon.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        <span style={label}>Cerca altre icone</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome… (es. azure sql, kubernetes, github)"
          autoFocus
          style={{ border: "1px solid var(--rule)", borderRadius: 6, padding: "8px 10px", fontSize: 14, background: "var(--paper)", color: "var(--ink)", font: "inherit" }}
        />
        {q.length < 2 ? (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{SEARCHABLE_ICONS.length} icone disponibili, digita almeno 2 caratteri per cercare</span>
        ) : results.length === 0 ? (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Nessun risultato per "{query}"</span>
        ) : (
          <div style={grid}>
            {results.map((icon) => (
              <button key={icon.id} type="button" title={icon.label} onClick={() => onSelect(icon.id)} style={tile(value === icon.id)}>
                <img src={resolveIconUrl(icon.id)} alt="" style={{ width: 40, height: 40, display: "block" }} />
                <span style={tileLabel}>{icon.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </SidePanel>
  );
}

const label: CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" };

const grid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))", gap: 8 };

const tileLabel: CSSProperties = {
  fontSize: 10.5,
  color: "var(--muted)",
  textAlign: "center",
  lineHeight: 1.2,
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical" as const,
};

function tile(active: boolean): CSSProperties {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "10px 6px",
    border: active ? "2px solid var(--accent)" : "1px solid var(--rule)",
    borderRadius: 8,
    background: active ? "var(--accent-soft)" : "var(--paper)",
    cursor: "pointer",
  };
}

const btnSecondary: CSSProperties = { border: "1px solid var(--rule)", borderRadius: 6, padding: "6px 12px", fontSize: 13, background: "var(--paper)", cursor: "pointer", color: "var(--ink)" };
