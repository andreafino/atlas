import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ActivityIcon, ChatIcon, TeamIcon } from "../diagram/icons";

// Barra laterale "app Teams" di cornice, porting di design/Main.dc.html e Dashboard.dc.html.
// Puramente visiva per ora: l'integrazione reale in Teams (SSO, Teams JS SDK) è il punto 6 del piano.
export function TeamsNav() {
  return (
    <nav aria-label="Barra app Teams" style={navStyle}>
      <button type="button" aria-label="Attività" style={iconBtn(false)} disabled>
        <ActivityIcon size={22} />
      </button>
      <button type="button" aria-label="Chat" style={iconBtn(false)} disabled>
        <ChatIcon size={22} />
      </button>
      <button type="button" aria-label="Team" style={iconBtn(false)} disabled>
        <TeamIcon size={22} />
      </button>
      <Link to="/" aria-label="Architetture EOS – tutti i progetti" style={logoStyle}>
        EOS
      </Link>
    </nav>
  );
}

const navStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 6,
  padding: "12px 0",
  background: "var(--panel)",
  borderRight: "1px solid var(--rule)",
};

function iconBtn(current: boolean): CSSProperties {
  return {
    width: 48,
    height: 48,
    border: 0,
    borderRadius: 10,
    background: current ? "var(--card)" : "transparent",
    display: "grid",
    placeItems: "center",
    color: current ? "var(--ink)" : "var(--muted)",
    cursor: "default",
    boxShadow: current ? "0 1px 2px rgba(56,47,45,.15)" : "none",
  };
}

const logoStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  textDecoration: "none",
  fontFamily: "'Barlow Semi Condensed',sans-serif",
  fontWeight: 700,
  fontSize: 13,
  color: "var(--accent)",
};
