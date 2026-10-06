# Vector – Specifica funzionale

Portale per gli schemi architetturali e i documenti del Solution Architect, organizzati per progetto.
All'inizio lo usa un solo Solution Architect, poi verrà esteso a tutte le BU di EOS Solutions come standard aziendale.

Fonte: sessione di analisi del 1 ottobre 2026. Design di riferimento: cartella `design/`.

## 1. Piattaforma

- **Una sola web app**, pubblicata in due modi:
  - **App Teams**, come scheda (tab) nel team di progetto. Si apre direttamente sulla dashboard di quel progetto.
  - **Browser**, per la vista trasversale su tutti i progetti.
- **Login**: SSO con l'account aziendale (Microsoft Entra ID). In Teams usa l'SSO nativo, senza una pagina di login separata.

## 2. Progetti, visibilità e permessi

- **Relazione 1:1**: un progetto corrisponde a un team di Microsoft Teams.
- **Visibilità**: sincronizzata da Teams. L'utente vede solo i progetti dei team di cui fa parte.
- **Permessi** (modifica / sola lettura): gestiti nel portale, per singolo utente e progetto.

## 3. Flusso UX

1. **Login** (SSO)
2. **Lista progetti**: solo i progetti abilitati, con filtro per ruolo e una ricerca → `design/Main.dc.html`
3. **Dashboard progetto**: informazioni di base, icona, documenti, elenco dei diagrammi, chat sui documenti → `design/Dashboard.dc.html`
4. **Click su un diagramma** → apre il designer → `design/DesignerTeams.dc.html`
5. **Click su un documento** → redirect alla sorgente (SharePoint / OneNote)

## 4. Documenti

- I documenti **non vengono salvati nel portale**: restano su SharePoint.
- Vengono letti **in automatico dal sito SharePoint del team** e dal **OneNote del team**. Non si inseriscono link a mano.
- La prevendita (stime, offerte, RFP) è **fuori perimetro**.

## 5. Designer

Tutti i deliverable di disegno si producono nel designer, in una **vista unica** con livelli e filtri.

- **Consultazione**: visualizzare entità e flussi per capire lo stato attuale (as-is) del cliente. Prevede la riproduzione passo-passo dei flussi, come nel design esistente.
- **Editing manuale**: creare, modificare ed eliminare entità, flussi, tecnologie e collegamenti tra gli attori.
- **Editing via chat**: l'utente descrive la modifica in linguaggio naturale. Il sistema ne estrae le informazioni ed esegue **le stesse azioni dell'editing manuale**, applicate **subito, senza conferma**.
- **Annulla / ripeti e storico versioni**: ogni modifica, manuale o da chat, crea una voce di storico ripristinabile.
- **Livelli secondo il modello C4**:
  - Landscape: vista d'insieme del cliente
  - Context, Container e Component: zoom crescente
  - Deployment: infrastruttura
  - Vista dinamica: i flussi

## 6. Chat contestuale

Esiste **un'unica chat**, il cui ruolo cambia in base alla pagina in cui si trova:

| Pagina | Ruolo |
|---|---|
| Dashboard progetto | Assistente sui documenti (SharePoint + OneNote del team) |
| Designer | Assistente di aggiornamento del diagramma |

In entrambi i casi la chat individua le **interfacce già documentate** in OneNote o nei documenti e chiede se usarne una esistente o **creare un nuovo flusso**.

## 7. ADR (Architecture Decision Record)

- L'ADR è l'unico documento gestito nel portale. È una **lista associata al diagramma**, non un file separato.
- Ogni ADR può riferirsi **all'intero diagramma o a singoli elementi** (entità, flusso, tecnologia).
- Campi minimi: Id, Titolo, Stato (Proposto / Accettato / Deprecato / Sostituito), Contesto, Decisione, Conseguenze, Riferimento, Data, Autore.
- Dalla chat del designer si può creare un ADR a partire da una modifica appena applicata.

## 8. Modello dati (prima bozza)

```
Progetto      id, teamId (Teams), nome, cliente, BU, icona, sharePointSiteId, oneNoteNotebookId
Permesso      progettoId, utenteId, ruolo (edit|read)
Diagramma     id, progettoId, nome, livelloC4Predefinito, versioneCorrente
Versione      id, diagrammaId, numero, autore, origine (manuale|chat), descrizione, snapshot/diff, data
Banda         id, diagrammaId, etichetta, x, y, w, h          (es. sottoscrizione, VNet, tenant)
Entità        id, diagrammaId, nome, sottotitoli[], icona|mono, banda, livelloC4, x, y, h?, descrizione, moduli[]
Collegamento  id, da, a, percorso[[x,y]], etichetta, bidirezionale
Flusso        id, gruppo, titolo, dove, nota, passi[{da, a, collegamentoId, direzione, etichetta, moduli[]}]
Tecnologia    id, gruppo, nome, icona|mono, entità[], descrizione
Autenticazione n, tipo, da, verso[], meccanismo, credenziale
ADR           id, diagrammaId, riferimento {tipo: diagramma|entità|flusso|tecnologia, id}, campi §7
```

`samples/e-commerce-bc.json` contiene il diagramma reale "Architettura E-commerce BC", estratto dal design. Va usato come dato di test e come base per lo schema.

## 9. Domande aperte

- Stack e hosting definitivi (vedi proposta in `CLAUDE.md`)
- Modello AI per la chat e dove viene eseguito
- Chi può creare progetti e assegnare i permessi (ruolo amministratore)
- Gestione dei team Teams senza progetto e dei progetti archiviati
