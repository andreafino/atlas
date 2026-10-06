import { createServer } from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { CallToolRequestSchema, ListToolsRequestSchema, isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const MAX_BODY_BYTES = 1024 * 1024;

function sameSecret(received, expected) {
  const a = Buffer.from(received ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function isAuthorized(req, token) {
  return sameSecret(req.headers["x-api-key"], token) || sameSecret(req.headers.authorization, `Bearer ${token}`);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("payload troppo grande"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : undefined);
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sendJsonError(res, status, message) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message }, id: null }));
}

export async function startMcpHttpServer({ port, token, listTools, callTool }) {
  const transports = new Map();

  function buildServer() {
    const server = new Server({ name: "atlas", version: "1.0.0" }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: listTools().map(({ name, description, input_schema }) => ({ name, description, inputSchema: input_schema })),
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const client = server.getClientVersion()?.name ?? "MCP";
      try {
        const payload = await callTool(request.params.name, request.params.arguments ?? {}, client);
        return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
      } catch (err) {
        return { isError: true, content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }] };
      }
    });
    return server;
  }

  async function handle(req, res) {
    if (!isAuthorized(req, token)) {
      sendJsonError(res, 401, "Token MCP mancante o non valido");
      return;
    }

    const sessionId = req.headers["mcp-session-id"];
    let transport = sessionId ? transports.get(sessionId) : undefined;

    if (req.method === "POST") {
      let body;
      try {
        body = await readJson(req);
      } catch {
        sendJsonError(res, 400, "Corpo della richiesta non valido");
        return;
      }
      if (!transport) {
        if (sessionId || !isInitializeRequest(body)) {
          sendJsonError(res, 400, "Sessione MCP non valida: inizializza prima la connessione");
          return;
        }
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id) => transports.set(id, transport),
        });
        transport.onclose = () => {
          if (transport.sessionId) transports.delete(transport.sessionId);
        };
        await buildServer().connect(transport);
      }
      await transport.handleRequest(req, res, body);
      return;
    }

    if (!transport) {
      sendJsonError(res, 400, "Sessione MCP non valida");
      return;
    }
    await transport.handleRequest(req, res);
  }

  const http = createServer((req, res) => {
    if (req.url !== "/mcp") {
      res.writeHead(404).end();
      return;
    }
    handle(req, res).catch((err) => {
      if (!res.headersSent) sendJsonError(res, 500, err instanceof Error ? err.message : "Errore interno");
    });
  });

  await new Promise((resolve, reject) => {
    http.once("error", reject);
    http.listen(port, "127.0.0.1", resolve);
  });

  return {
    close: async () => {
      for (const transport of transports.values()) await transport.close();
      transports.clear();
      await new Promise((resolve) => http.close(resolve));
    },
  };
}
