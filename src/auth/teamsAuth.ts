import { app, authentication } from "@microsoft/teams-js";

// L'SDK Teams deve girare sia dentro Teams (tab in un iframe che dialoga col frame genitore) sia da
// browser standalone (SPEC.md: "accessibile anche da browser"). Fuori da Teams `app.initialize()`
// non si risolve mai, perché non c'è nessun frame genitore con cui completare l'handshake: la
// corsa con un timeout breve è l'unico modo per distinguere i due casi senza bloccare l'avvio.
let initPromise: Promise<boolean> | null = null;

export function initializeTeams(timeoutMs = 600): Promise<boolean> {
  if (!initPromise) {
    initPromise = Promise.race([
      app.initialize().then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
    ]).catch(() => false);
  }
  return initPromise;
}

export async function isInsideTeams(): Promise<boolean> {
  return initializeTeams();
}

export async function getTeamsContext(): Promise<app.Context | null> {
  const inTeams = await initializeTeams();
  if (!inTeams) return null;
  return app.getContext();
}

// Token SSO della tab (audience = app registration di questa app, api://<dominio>/<clientId>, vedi
// appPackage/manifest.json → webApplicationInfo). Non è un token Graph: va scambiato lato backend
// col flusso on-behalf-of (api/src/functions/me.ts) prima di poter chiamare Microsoft Graph.
export async function getTeamsSsoToken(): Promise<string | null> {
  const inTeams = await initializeTeams();
  if (!inTeams) return null;
  try {
    return await authentication.getAuthToken();
  } catch (err) {
    console.error("Impossibile ottenere il token SSO di Teams", err);
    return null;
  }
}

// Mappa il tema di Teams (default/dark/contrast) sul nostro attributo data-theme; "contrast" non ha
// un equivalente diretto nella nostra palette, quindi ricade su "dark" (più vicino per contrasto).
export function teamsThemeToAppTheme(teamsTheme: string | undefined): "light" | "dark" {
  return teamsTheme === "dark" || teamsTheme === "contrast" ? "dark" : "light";
}
