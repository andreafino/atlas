# Istruzioni per Claude Code

Stai sviluppando **EOS Architetture**: un'app Teams, accessibile anche da browser, per gestire diagrammi architetturali e ADR per progetto.

## Leggi prima
1. `SPEC.md`: requisiti e decisioni prese. Non riaprirle senza chiedere.
2. `design/`: il design di riferimento.
   - Ogni `.dc.html` è una schermata.
   - La logica di disegno del diagramma (bande, entità, collegamenti, riproduzione dei flussi, zoom/pan) è in `design/Designer.dc.html`, dentro lo script `class Component`.
   - I file usano un runtime di Claude Design (`support.js`) che non è incluso: usali come riferimento di layout, stile e comportamento, non come codice da eseguire.
3. `samples/e-commerce-bc.json`: dati reali di un diagramma.

## Stile (dal design)
- Colori:
  - Accento `#F08019`, accento testo `#B35A07`, accento tenue `#FDEBD9`
  - Inchiostro `#382F2D`, testo secondario `#76696A`, filetti `#E2DCD6`
  - Fondo `#FBFAF8`, pannello `#F3F0EC`, card `#FFFFFF`
- Il tema scuro è in `THEMES.dark` dentro `Designer.dc.html`.
- Font:
  - Barlow Semi Condensed per titoli ed etichette maiuscole
  - Source Sans 3 per il testo
  - JetBrains Mono per numeri e codici
- Icone dei servizi: `design/icons/`.

## Stack proposto (da confermare con l'utente prima di iniziare)
- **Frontend**: React + TypeScript + Vite. Il diagramma va renderizzato in SVG/HTML con zoom e pan, come nel design.
- **App Teams**: Microsoft 365 Agents Toolkit (ex Teams Toolkit), tab con SSO e Teams JS SDK.
- **Backend**: API su Azure (App Service o Functions), autenticazione Entra ID con flusso on-behalf-of verso Microsoft Graph.
- **Microsoft Graph**:
  - Membri e team: `joinedTeams`
  - Sito SharePoint e file del team
  - Notebook OneNote del team
- **Persistenza**: database per progetti, permessi, diagrammi, versioni e ADR. Lo storico va salvato come snapshot o diff per versione.
- **Chat**: un LLM con *tool calling*. Gli strumenti dell'assistente sono le **stesse operazioni** dell'editor manuale (`addEntity`, `addEdge`, `addFlow`, `addTechnology`, `deleteElement`, `createAdr`...). Così chat e UI condividono un solo livello di comandi, e annulla/storico funzionano allo stesso modo.

## Ordine di sviluppo consigliato
1. Modello dati + import di `samples/e-commerce-bc.json`
2. Visualizzatore del diagramma in sola lettura (porting della vista `Designer.dc.html`)
3. Livello di comandi (add/update/delete) con annulla/ripeti e versioni
4. Editing manuale nella UI
5. Lista progetti e dashboard, prima con dati finti, poi con Graph (team, SharePoint, OneNote)
6. App Teams + SSO
7. Permessi modifica/lettura
8. ADR collegati a diagramma o elementi
9. Chat contestuale (prima designer, poi documenti)

## Regole
- Testi dell'interfaccia in italiano.
- Prima di scelte infrastrutturali o di stack, chiedi conferma.
