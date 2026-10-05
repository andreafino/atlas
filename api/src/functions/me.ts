import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from "@azure/functions";
import { exchangeForGraphToken } from "../obo";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? "*";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function withCors(res: HttpResponseInit): HttpResponseInit {
  return { ...res, headers: { ...CORS_HEADERS, "Content-Type": "application/json", ...res.headers } };
}

interface GraphMe {
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
}

interface GraphJoinedTeams {
  value: unknown[];
}

// GET /api/me — profilo utente + numero di team Teams a cui appartiene (Graph /me e /me/joinedTeams),
// a dimostrazione che il flusso SSO → on-behalf-of → Graph funziona end-to-end (punto 6 del piano).
// Il frontend lo chiama da src/auth/useMe.ts passando il token SSO della tab come Bearer: qui viene
// scambiato con un token Graph (exchangeForGraphToken) prima di ogni chiamata, non è mai inoltrato
// direttamente a Graph (ha un'audience diversa, non sarebbe comunque accettato).
export async function me(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  if (request.method === "OPTIONS") return withCors({ status: 204 });

  const authHeader = request.headers.get("authorization") ?? "";
  const ssoToken = authHeader.replace(/^Bearer\s+/i, "");
  if (!ssoToken) return withCors({ status: 401, jsonBody: { error: "Header Authorization: Bearer <token SSO> mancante." } });

  try {
    const graphToken = await exchangeForGraphToken(ssoToken);

    const [meRes, teamsRes] = await Promise.all([
      fetch("https://graph.microsoft.com/v1.0/me", { headers: { Authorization: `Bearer ${graphToken}` } }),
      fetch("https://graph.microsoft.com/v1.0/me/joinedTeams?$select=id", { headers: { Authorization: `Bearer ${graphToken}` } }),
    ]);

    if (!meRes.ok) throw new Error(`Graph /me: HTTP ${meRes.status}`);
    const meData = (await meRes.json()) as GraphMe;
    const teamsData: GraphJoinedTeams = teamsRes.ok ? ((await teamsRes.json()) as GraphJoinedTeams) : { value: [] };

    return withCors({
      jsonBody: {
        displayName: meData.displayName,
        mail: meData.mail ?? meData.userPrincipalName ?? null,
        joinedTeamsCount: teamsData.value.length,
      },
    });
  } catch (err) {
    context.error("Errore nello scambio on-behalf-of o nella chiamata a Graph", err);
    return withCors({ status: 502, jsonBody: { error: err instanceof Error ? err.message : "Errore sconosciuto" } });
  }
}

app.http("me", {
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  route: "me",
  handler: me,
});
