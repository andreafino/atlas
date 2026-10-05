# App Teams + SSO — setup

Scaffolding del punto 6 del piano in `CLAUDE.md`. Il codice qui dentro (manifest, Teams JS SDK nel
frontend, backend Azure Functions con lo scambio on-behalf-of) è pronto ma **non è mai stato eseguito
contro un vero tenant**: non ho accesso a un tenant Microsoft 365/Entra ID, quindi i passaggi seguenti
vanno fatti a mano prima che l'SSO funzioni davvero. Finché non sono completati, l'app continua a
funzionare normalmente da browser standalone con i dati finti (vedi `src/data/mockProjects.ts`) — il
codice Teams si disattiva da solo fuori da Teams (vedi `src/auth/teamsAuth.ts`).

## Test rapido: solo l'UI, senza SSO

Se per ora vuoi solo vedere l'app dentro Teams (niente login/Graph), **salta le sezioni 1-2 qui sotto**:
non serve nessuna registrazione Entra ID. Usa `appPackage/manifest.ui-only.json` invece di
`appPackage/manifest.json` — è identico ma senza `webApplicationInfo`/`permissions: ["identity"]`,
con un `id` già valorizzato (`5c332e6b-55c6-4e00-859c-f891d2b61c06`, generato localmente, non legato
a nessun account).

1. Avvia un tunnel HTTPS verso il frontend in dev: `devtunnel host -p 5173 --allow-anonymous` (o `ngrok http 5173`).
2. Prendi il dominio pubblico che ti dà il tunnel (es. `xxxx.devtunnels.ms`, **senza** `https://`).
3. Dimmelo: sostituisco `TAB_DOMAIN` in `appPackage/manifest.ui-only.json` con quel dominio e preparo
   lo zip (`manifest.json` rinominato + `color.png` + `outline.png`) pronto da caricare.
4. In Teams: **App → Gestisci le tue app → Carica un'app personalizzata**, carica lo zip.
5. Tieni avviato `npm run dev` nel frontend per tutta la sessione di test (il tunnel punta lì).

Quando poi vorrai provare anche l'SSO, si riparte da `appPackage/manifest.json` (quello con
`webApplicationInfo`) e dai passaggi 1-2 qui sotto.

## 1. Registrare l'app in Entra ID

Nel portale Azure, Entra ID → **Registrazioni app** → Nuova registrazione:

1. Nome: `Atlas` (o quello che preferisci).
2. Tipi di account supportati: solo il tuo tenant (single-tenant), salvo serva multi-tenant.
3. Dopo la creazione, annota **Application (client) ID** e **Directory (tenant) ID**.
4. **Esponi un'API** (Expose an API):
   - Imposta l'URI applicazione su `api://<tuo-dominio>/<client-id>` (es. `api://localhost:5173/<client-id>` per il test locale, da cambiare col dominio reale al deploy).
   - Aggiungi lo scope `access_as_user`, tipo "Admins and users", consentito per `Admins and users`.
   - In **Client applications** autorizza gli ID client ufficiali di Teams/Office (sono gli stessi per tutti i tenant, elencati nella [documentazione Microsoft sull'SSO per le tab](https://learn.microsoft.com/microsoftteams/platform/tabs/how-to/authentication/auth-aad-sso)).
5. **Autorizzazioni API** → aggiungi i permessi delegati Graph che servono (per ora: `User.Read`, `Team.ReadBasic.All`) e concedi il consenso amministratore.
6. **Certificati e segreti** → crea un client secret, copialo subito (non sarà più visibile).

## 2. Valorizzare le variabili d'ambiente

- `env/.env.local` (già nel repo, non sensibile): `TEAMS_APP_ID` (vedi punto 3), `AAD_APP_CLIENT_ID`, `AAD_APP_TENANT_ID`, `TAB_DOMAIN`/`TAB_ENDPOINT` se diversi da `localhost:5173`.
- `env/.env.local.user` (copia `env/.env.local.user.sample`, **non va mai versionato**): per ora non necessaria lato frontend (il client secret resta solo nel backend).
- `api/local.settings.json` (copia `api/local.settings.json.sample`, **non va versionato**): `AAD_APP_CLIENT_ID`, `AAD_APP_TENANT_ID`, `AAD_APP_CLIENT_SECRET` (il secret del punto 1.6).

## 3. Registrare l'app Teams e ottenere un TEAMS_APP_ID

Più semplice tramite il [Developer Portal per Teams](https://dev.teams.microsoft.com/apps): importa
`appPackage/manifest.json` (sostituendo a mano i placeholder `${{...}}` coi valori reali, oppure usa
l'estensione VS Code **Microsoft 365 Agents Toolkit** che fa la sostituzione automaticamente leggendo
`env/.env.local` — consigliato se disponibile, dato che genera anche i file di pipeline
`m365agents.yml` che qui non sono stati creati per non inventare uno schema non verificabile senza
la CLI). L'app Teams risultante ha un proprio ID: valorizzalo in `TEAMS_APP_ID`.

## 4. Avviare tutto in locale

```bash
# terminale 1 — backend
cd api
npm install
npm run build
func start        # richiede Azure Functions Core Tools v4 (npm i -g azure-functions-core-tools@4)

# terminale 2 — frontend
npm install
npm run dev
```

Il frontend da solo (`npm run dev`, browser normale) funziona già con i dati finti, SSO disattivato.
Per provare l'SSO serve caricare l'app **dentro Teams** (sideload del pacchetto da Developer Portal
o da Teams → App → Gestisci le tue app → Carica un'app personalizzata, zippando
`appPackage/manifest.json` + `color.png` + `outline.png`), con `contentUrl` che punta al tunnel HTTPS
verso `localhost:5173` (serve un tunnel, es. `devtunnel` o `ngrok`, perché Teams richiede HTTPS e non
raggiunge `localhost` del tuo PC direttamente).

## 5. Cosa verificare dopo il setup

- Aprendo la tab dentro Teams, l'avatar in alto a destra nella lista progetti (`/`) mostra le tue
  iniziali reali invece di `[IN]` (chiamata end-to-end: `src/auth/useMe.ts` → `api/src/functions/me.ts`
  → scambio on-behalf-of → Graph `/me` + `/me/joinedTeams`).
- Il tema chiaro/scuro di Teams viene applicato all'avvio (`src/auth/useTeamsHost.ts`).
- Se qualcosa fallisce, l'avatar mostra un tooltip con l'errore (passa il mouse sopra `[IN]`/le iniziali).

## Note aperte, da rivedere prima della produzione

- `@azure/msal-node@^2.x` porta una dipendenza transitiva `uuid` con un avviso di sicurezza moderato
  (`npm audit` in `api/`); il fix richiede l'aggiornamento a `@azure/msal-node@7` (breaking change),
  non ancora provato contro il codice in `api/src/obo.ts` — da validare quando si riprende questo punto.
- Non è stato creato `m365agents.yml`/`m365agents.local.yml` (la pipeline di provisioning/deploy del
  Microsoft 365 Agents Toolkit): lo schema cambia spesso tra versioni del toolkit e non potevo
  verificarlo senza la CLI installata. Se apri il progetto con l'estensione VS Code del toolkit,
  dovrebbe proporti di generarli puntando ad `appPackage/` e `api/` già pronti.
- La lista progetti (`ProjectListPage`) resta sui dati finti anche quando l'SSO funziona: non
  sostituisce ancora `MOCK_PROJECTS` con `joinedTeams` reale. È un passo naturale successivo, non
  ancora fatto per tenere questo round sulla sola infrastruttura Teams/SSO.
- Nessun test automatico per `api/` o per i nuovi hook (`src/auth/*`): entrambi dipendono da un host
  Teams reale/un tenant Entra ID, difficili da simulare in modo significativo in jsdom; il resto della
  suite (50 test) continua a passare invariato.
