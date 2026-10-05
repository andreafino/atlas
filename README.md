# Atlas

Portale per gli schemi architetturali e i documenti del Solution Architect, organizzati per progetto.

Vedi `SPEC.md` per la specifica funzionale e `CLAUDE.md` per le istruzioni di sviluppo.

## Stack

- React + TypeScript + Vite (frontend)
- Azure Functions (backend, SSO/Graph on-behalf-of — vedi `TEAMS_SETUP.md`)
- Persistenza su file JSON, non su database relazionale:
  - fuori Teams: apri/salva un file locale dal browser (File System Access API con fallback a download/upload)
  - dentro Teams (da costruire): lo stesso file salvato nel sito SharePoint del team via Microsoft Graph, con la cartella/posizione scelta dall'utente
  - permessi di modifica/lettura: nessuna tabella custom, si usano i permessi nativi del file/cartella (SharePoint quando applicabile)
  - storico versioni: incluso nello stesso file JSON come array di snapshot (vedi `src/store/diagramStore.ts`), non dipende dal version history di SharePoint
- Microsoft 365 Agents Toolkit (app Teams)

## Sviluppo

```bash
npm install
npm run dev
```

## App desktop (Electron)

```bash
npm run dev:electron
```

Avvia il dev server Vite e apre l'app in una finestra Electron, con hot reload.

```bash
npm run build:electron
```

Compila il frontend e genera l'installer Windows (NSIS) in `release/`.

Se cambi `icon.png` nella root del progetto, rigenera le icone usate dall'app desktop
(`build/icon.ico` per l'installer, `build/icon.png` per l'icona della finestra) prima di
lanciare `build:electron`:

```bash
node scripts/make-icon.cjs
```
