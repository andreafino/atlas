import { ConfidentialClientApplication } from "@azure/msal-node";

let cca: ConfidentialClientApplication | null = null;

function getCca(): ConfidentialClientApplication {
  if (!cca) {
    const clientId = process.env.AAD_APP_CLIENT_ID ?? "";
    const tenantId = process.env.AAD_APP_TENANT_ID ?? "";
    const clientSecret = process.env.AAD_APP_CLIENT_SECRET ?? "";
    if (!clientId || !tenantId || !clientSecret) {
      throw new Error("Configurazione Entra ID mancante: impostare AAD_APP_CLIENT_ID, AAD_APP_TENANT_ID, AAD_APP_CLIENT_SECRET (vedi TEAMS_SETUP.md).");
    }
    cca = new ConfidentialClientApplication({
      auth: { clientId, authority: `https://login.microsoftonline.com/${tenantId}`, clientSecret },
    });
  }
  return cca;
}

// Scambia il token SSO della tab (da authentication.getAuthToken() nel frontend, audience = questa
// app registration) con un token Microsoft Graph tramite il flusso on-behalf-of: l'utente non deve
// autenticarsi una seconda volta, si usa il consenso delegato già dato per questa app.
export async function exchangeForGraphToken(ssoToken: string, scopes: string[] = ["User.Read", "Team.ReadBasic.All"]): Promise<string> {
  const result = await getCca().acquireTokenOnBehalfOf({ oboAssertion: ssoToken, scopes });
  if (!result?.accessToken) throw new Error("Scambio on-behalf-of non riuscito: nessun access token restituito.");
  return result.accessToken;
}
