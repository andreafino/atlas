// Client minimale per l'API Messages di Anthropic, chiamata direttamente dal browser.
// ATTENZIONE: nessun proxy server. La API key viaggia (ed è visibile) nelle richieste fatte
// da questo stesso browser: vedi avviso mostrato in ChatPanel.

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 1024;

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface AnthropicResponse {
  content: (TextBlock | ToolUseBlock)[];
  stop_reason: string;
}

export async function sendMessage({
  apiKey,
  system,
  messages,
  tools,
}: {
  apiKey: string;
  system: string;
  messages: AnthropicMessage[];
  tools: AnthropicTool[];
}): Promise<AnthropicResponse> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system, messages, tools }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message ?? "";
    } catch {
      // risposta non JSON, nessun dettaglio aggiuntivo
    }
    if (res.status === 401) throw new Error("Chiave API non valida o scaduta.");
    if (res.status === 429) throw new Error("Troppe richieste all'API Anthropic. Riprova tra poco.");
    throw new Error(detail || `Richiesta ad Anthropic non riuscita (${res.status}).`);
  }

  return (await res.json()) as AnthropicResponse;
}
