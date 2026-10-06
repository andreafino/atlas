import { describeMcpTools, runMcpTool } from "./mcpTools";

export function connectMcpBridge(): () => void {
  const api = window.atlasDesktop?.mcp;
  if (!api) return () => {};

  api.registerTools(describeMcpTools());
  return api.onCall((call) => {
    try {
      const payload = runMcpTool(call.name, call.input, call.client);
      api.respond(call.id, true, payload);
    } catch (err) {
      api.respond(call.id, false, undefined, err instanceof Error ? err.message : String(err));
    }
  });
}
