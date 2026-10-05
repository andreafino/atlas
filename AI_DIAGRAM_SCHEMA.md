# Schema JSON per generare un diagramma EOS Architetture con un'AI

## Come usare questo documento

1. Copia **l'intero contenuto** di questo file in una qualsiasi AI con chat (ChatGPT, Gemini, Claude, ecc.).
2. Subito dopo, nello stesso messaggio, descrivi in linguaggio naturale l'architettura o il flusso che vuoi rappresentare (sistemi coinvolti, come comunicano, eventuali passi di un processo).
3. Chiedi esplicitamente che la risposta sia **solo il JSON**, senza testo intorno e senza blocco di codice markdown (niente ```` ```json ```` iniziale/finale) — serve un file `.json` pulito, non una spiegazione.
4. Salva la risposta in un file con estensione `.json`.
5. In EOS Architetture, apri quel file con **"Apri file"** nella barra degli strumenti dell'editor (icona cartella, in basso a destra). Il diagramma si apre direttamente, senza bisogno di convertirlo prima.

Se il risultato non si apre o è disordinato, incolla il messaggio di errore (o una descrizione del problema visivo) nella stessa conversazione con l'AI e chiedi una correzione — più avanti in questo documento trovi le regole che probabilmente sono state violate.

## Schema del formato

Il file deve essere un oggetto JSON con questi campi di primo livello: `bands`, `entities`, `edges`, `flows`, `technologies`, `authKinds`, `auth`. Tutti gli array devono essere presenti (anche vuoti `[]`) — se manca anche uno solo, l'importazione fallisce.

**Convenzione per gli id:** slug in kebab-case derivato dal nome (es. "API Gateway" → `api-gateway`), univoco all'interno della propria collezione (due entità non possono avere lo stesso id, ma un'entità e un collegamento sì).

### `bands[]` — i contenitori (es. "Internet", "Rete aziendale")

| Campo | Tipo | Obbligatorio | Note |
|---|---|---|---|
| `l` | string | sì | Etichetta visibile del contenitore |
| `x`, `y` | number | sì | Angolo in alto a sinistra |
| `w`, `h` | number | sì | Larghezza e altezza |

Non c'è un campo `id`: le entità si collegano a una banda per etichetta (vedi `entities[].band`), con confronto che ignora maiuscole/minuscole e spazi iniziali/finali — ma usa comunque lo stesso testo esatto per evitare ambiguità.

### `entities[]` — i nodi del diagramma (servizi, sistemi, componenti)

| Campo | Tipo | Obbligatorio | Note |
|---|---|---|---|
| `id` | string | sì | Slug univoco |
| `n` | string | sì | Nome visibile |
| `band` | string | sì | Deve combaciare con l'`l` di una banda in `bands[]` |
| `x`, `y` | number | sì | Angolo in alto a sinistra del rettangolo |
| `s` | string[] | no | Righe di sottotitolo sotto il nome |
| `icon` | string | no | Id di un'icona (vedi elenco sotto); se assente, si può usare `mono` |
| `mono` | string | no | Monogramma di 2-3 lettere maiuscole, mostrato al posto dell'icona se `icon` è assente |
| `h` | number | no | Altezza del rettangolo — vedi "Regole di layout" sotto, calcolala sempre esplicitamente |
| `desc` | string | no | Descrizione estesa, mostrata nel pannello laterale |
| `mods` | object[] | no | Dettagli interni (livello Component): lista di `{ "id": string, "t": string, "s": string }` — `t` è il titolo della riga, `s` il sottotitolo |

**Icone disponibili** (usa l'id esatto, minuscolo): `app` (App Service), `next` (Next.js), `vnet` (VNet), `sendgrid` (SendGrid), `sb` (Service Bus), `sql` (SQL Database), `entra` (Microsoft Entra ID), `bc` (Business Central), `dotnet` (.NET), `stripe` (Stripe), `func` (Azure Functions), `ai` (Application Insights), `kv` (Key Vault), `apim` (API Management), `cloudflare` (Cloudflare), `blob` (Blob Storage), `ext` (Entra External ID). Se nessuna di queste è adatta, ometti `icon` e usa `mono` con un monogramma breve (es. "Redis Cache" → `"RED"` o `"RC"`).

### `edges[]` — i collegamenti tra entità

| Campo | Tipo | Obbligatorio | Note |
|---|---|---|---|
| `id` | string | sì | Slug univoco |
| `a`, `b` | string | sì | Id delle due entità collegate (partenza/arrivo) |
| `d` | array di `[x,y]` | sì | Percorso del collegamento — vedi "Regole di layout" |
| `l` | string | no | Etichetta del collegamento |
| `lx`, `ly` | number | no | Posizione dell'etichetta (richiesti solo se `l` è presente) |
| `bi` | boolean | no | `true` se il collegamento è bidirezionale (freccia su entrambi gli estremi) |

### `flows[]` — i flussi (sequenze di passi tra entità, riproducibili passo-passo nell'app)

| Campo | Tipo | Obbligatorio | Note |
|---|---|---|---|
| `id` | string | sì | Slug univoco |
| `g` | string | sì | Gruppo (i flussi con lo stesso `g` vengono raggruppati nella sidebar) |
| `t` | string | sì | Titolo del flusso |
| `w` | string | sì | "Dove" si svolge (es. elenco sintetico dei sistemi coinvolti) |
| `note` | string | no | Nota descrittiva libera |
| `h` | array di tuple | sì | I passi del flusso — **vedi formato sotto, non è un array di oggetti** |

**Formato di ogni passo in `h[]`** (una tupla posizionale, non un oggetto):

```
[ da, a, collegamentoId, direzione, etichetta, moduli? ]
```

- `da`, `a` (string): id delle entità di partenza/arrivo del passo.
- `collegamentoId` (string | null): id di un collegamento in `edges[]` che unisce `da` e `a` (in un verso o nell'altro) — usalo per evidenziare quella freccia durante la riproduzione del flusso; `null` se non c'è un collegamento esplicito.
- `direzione` (`1` o `-1`): `1` se il passo segue il verso naturale `a→b` del collegamento, `-1` se lo percorre al contrario.
- `etichetta` (string): descrizione del passo, mostrata nella lista.
- `moduli` (string[], opzionale): id di eventuali `mods[]` da evidenziare durante questo passo (formato `entityId.moduloId`, es. `"bc.log"`). Omettilo se non servono dettagli interni.

Esempio di un passo: `["utente", "api-gateway", "e1", 1, "Richiesta di login"]`.

### `technologies[]` — tecnologie/protocolli trasversali, collegati a una o più entità

| Campo | Tipo | Obbligatorio | Note |
|---|---|---|---|
| `id` | string | sì | Slug univoco |
| `g` | string | sì | Gruppo (es. "Microsoft Azure", "Framework e protocolli") |
| `n` | string | sì | Nome visibile |
| `icon` | string | no | Stesso elenco icone di sopra |
| `mono` | string | no | Monogramma, alternativa a `icon` |
| `e` | string[] | sì | Id delle entità a cui è associata (può essere `[]`) |
| `d` | string | sì | Descrizione |

### `authKinds` e `auth[]` — meccanismi di autenticazione (opzionali ma sempre presenti)

Anche se non vuoi documentare l'autenticazione, **includi sempre entrambi i campi**, vuoti — se mancano, la vista "Autenticazione" dell'app può rompersi:

```json
"authKinds": { "mi": "", "tok": "", "sec": "", "per": "" },
"auth": []
```

Se invece vuoi popolarli: `authKinds` è una mappa fissa a 4 chiavi (`mi`, `tok`, `sec`, `per`) verso un'etichetta leggibile per ciascun tipo (es. `"mi": "Managed Identity"`, `"tok": "Token"`, `"sec": "Secret"`, `"per": "Permessi delegati"` — le etichette sono libere, le 4 chiavi no). `auth[]` è una lista di tuple:

```
[ n, tipo, da, verso, meccanismo, credenziale ]
```

- `n` (number): numero progressivo della riga.
- `tipo` (string): una delle 4 chiavi di `authKinds` (`mi` | `tok` | `sec` | `per`).
- `da` (string): id dell'entità che si autentica.
- `verso` (string[]): id delle entità verso cui si autentica (può essere più di una).
- `meccanismo` (string): descrizione del meccanismo (es. "Client credentials flow").
- `credenziale` (string): cosa viene scambiato/verificato (es. "Client secret in Key Vault").

## Regole di layout

L'app **non ricalcola automaticamente** le coordinate all'importazione: usa esattamente i numeri che fornisci. Calcolali con queste regole per ottenere un disegno già leggibile, senza sovrapposizioni:

- **Dimensioni di un'entità:** larghezza fissa **240px**. Altezza: **72px** se non ha `mods[]`; se ne ha, **66 + 48 × (numero di elementi in `mods[]`)** (es. 3 dettagli → 66+144 = 210px) — questo spazio serve a disegnare la riga titolo/sottotitolo più una riga per ogni dettaglio, senza che nulla esca dal bordo.
- **Dimensioni di un contenitore (banda):** deve essere il rettangolo che racchiude tutte le entità che hanno quel `band`, con un margine di **30px** a sinistra e a destra, **40px** sopra, **30px** sotto. Calcolo: prendi `minX`/`minY` (gli `x`/`y` più piccoli tra le entità) e `maxX`/`maxY` (il bordo destro/inferiore più grande, cioè `x+240` e `y+altezza` più alti), poi `banda.x = minX-30`, `banda.y = minY-40`, `banda.w = (maxX-minX)+60`, `banda.h = (maxY-minY)+70`. Esempio: due entità impilate a `x:100,y:200` e `x:100,y:288` (altezza 72 ciascuna): `minX=100, minY=200, maxX=340 (100+240), maxY=360 (288+72)` → banda `x:70, y:160, w:300, h:230`. Una banda senza entità può avere dimensioni a piacere (es. 280×160).
- **Disposizione generale:** colloca le bande una accanto all'altra o una sopra l'altra secondo la logica del dominio (es. "Internet" a sinistra, poi via via le bande più interne verso destra). Dentro una banda, impila le entità verticalmente spaziandole di circa **88px** (72 + 16 di margine tra una e l'altra; usa un valore maggiore se le entità hanno `mods[]` e quindi sono più alte), oppure disponile in riga spaziandole di circa **280px** (240 + 40) se la banda è pensata in orizzontale.
- **Percorso di un collegamento (`d`):** lista di punti `[x,y]` che partono e arrivano sul bordo (non sul centro) delle due entità.
  - Se le due entità sono circa alla stessa altezza (si sovrappongono verticalmente): un segmento orizzontale dritto, 2 punti, dal bordo destro dell'una al bordo sinistro dell'altra (o viceversa).
  - Se sono circa nella stessa colonna (si sovrappongono orizzontalmente): un segmento verticale dritto, 2 punti, stessa logica sull'asse verticale.
  - Altrimenti: un percorso a gomito di 4 punti con angoli retti — esce dal bordo dell'entità di partenza (dal lato rivolto verso l'altra), piega a metà strada, entra perpendicolarmente nell'altra entità.
  - Non serve precisione millimetrica: l'app non ricalcola questi percorsi all'importazione, basta che il disegno risulti leggibile e che le linee non attraversino i rettangoli delle entità.
- **Etichetta di un collegamento (`lx`, `ly`):** punto medio del percorso — per un segmento singolo è il centro tra i due punti, per un gomito è il centro del segmento intermedio (quello tra i due punti di piega).

## Esempio minimo completo

Due bande, tre entità, un collegamento, un flusso, una tecnologia, autenticazione vuota. Puoi incollarlo in EOS Architetture con "Apri file" per verificare subito che il formato funzioni, prima ancora di chiedere un diagramma vero a un'AI.

```json
{
  "bands": [
    { "l": "Internet", "x": 0, "y": 0, "w": 280, "h": 160 },
    { "l": "Rete aziendale", "x": 360, "y": 0, "w": 580, "h": 160 }
  ],
  "entities": [
    { "id": "utente", "n": "Utente", "mono": "UTE", "band": "Internet", "x": 20, "y": 44, "s": ["browser"] },
    { "id": "api-gateway", "n": "API Gateway", "icon": "apim", "band": "Rete aziendale", "x": 380, "y": 44 },
    { "id": "db", "n": "Database ordini", "icon": "sql", "band": "Rete aziendale", "x": 660, "y": 44 }
  ],
  "edges": [
    { "id": "e1", "a": "utente", "b": "api-gateway", "d": [[260, 80], [380, 80]], "l": "HTTPS", "lx": 320, "ly": 80, "bi": false },
    { "id": "e2", "a": "api-gateway", "b": "db", "d": [[620, 80], [660, 80]], "l": "TCP 1433", "lx": 640, "ly": 80 }
  ],
  "flows": [
    {
      "id": "f1",
      "g": "Ordini",
      "t": "Creazione di un ordine",
      "w": "Utente, API Gateway, Database ordini",
      "note": "Flusso di esempio per verificare l'importazione.",
      "h": [
        ["utente", "api-gateway", "e1", 1, "Invio della richiesta di ordine"],
        ["api-gateway", "db", "e2", 1, "Scrittura dell'ordine a database"]
      ]
    }
  ],
  "technologies": [
    { "id": "https", "g": "Protocolli", "n": "HTTPS", "e": ["utente", "api-gateway"], "d": "Comunicazione cifrata tra client e API Gateway." }
  ],
  "authKinds": { "mi": "", "tok": "", "sec": "", "per": "" },
  "auth": []
}
```
