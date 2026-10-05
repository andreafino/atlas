import { useCallback, useState } from "react";
import { useDiagramStore } from "../store/useDiagramStore";
import { sendMessage, type AnthropicMessage, type TextBlock, type ToolUseBlock } from "./anthropicClient";
import { CHAT_TOOLS, findChatTool, toAnthropicTools } from "./tools";

const MAX_ROUNDTRIPS = 6;

export type ChatMessage =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "changes"; labels: string[]; undoToIndex: number }
  | { kind: "error"; text: string };

const SYSTEM_PROMPT = `Sei l'assistente dell'editor di diagrammi architetturali EOS Architetture. Rispondi sempre in italiano, in modo breve.
Per ogni modifica al diagramma richiesta dall'utente usa gli strumenti forniti: non descrivere a parole una modifica senza applicarla con uno strumento.
Non inventare mai id di entità, collegamenti, contenitori, flussi o tecnologie: usa solo quelli presenti nello snapshot del diagramma fornito qui sotto, oppure quelli appena creati in questa stessa conversazione.
Se uno strumento restituisce un errore, correggi l'input e riprova, oppure spiega il problema all'utente.

Snapshot del diagramma corrente (JSON):
`;

export function useDiagramChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [anthropicMessages, setAnthropicMessages] = useState<AnthropicMessage[]>([]);
  const [pending, setPending] = useState(false);

  const sendUserMessage = useCallback(async (apiKey: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    setMessages((prev) => [...prev, { kind: "user", text: trimmed }]);
    setPending(true);

    const turnStartIndex = useDiagramStore.getState().index;
    const appliedLabels: string[] = [];

    let history = [...anthropicMessages, { role: "user" as const, content: trimmed }];

    try {
      const diagram = useDiagramStore.getState().diagram;
      const system = `${SYSTEM_PROMPT}${JSON.stringify(diagram)}`;

      for (let round = 0; round < MAX_ROUNDTRIPS; round++) {
        const response = await sendMessage({ apiKey, system, messages: history, tools: toAnthropicTools(CHAT_TOOLS) });
        history = [...history, { role: "assistant", content: response.content }];

        const toolUses = response.content.filter((b): b is ToolUseBlock => b.type === "tool_use");
        const textBlocks = response.content.filter((b): b is TextBlock => b.type === "text");
        const text = textBlocks.map((b) => b.text).join("\n").trim();

        if (toolUses.length === 0) {
          if (text) setMessages((prev) => [...prev, { kind: "assistant", text }]);
          break;
        }

        if (text) setMessages((prev) => [...prev, { kind: "assistant", text }]);

        const results = toolUses.map((call) => {
          try {
            const tool = findChatTool(call.name);
            if (!tool) throw new Error(`Strumento sconosciuto: "${call.name}".`);
            const current = useDiagramStore.getState().diagram;
            const command = tool.execute(call.input, current);
            useDiagramStore.getState().apply(command, { origine: "chat", autore: "Assistente" });
            appliedLabels.push(command.label);
            return { call, ok: true as const, text: "Fatto." };
          } catch (err) {
            const message = err instanceof Error ? err.message : "Errore sconosciuto.";
            return { call, ok: false as const, text: message };
          }
        });

        history = [
          ...history,
          {
            role: "user",
            content: results.map(({ call, ok, text: resultText }) => ({
              type: "tool_result" as const,
              tool_use_id: call.id,
              content: resultText,
              is_error: !ok,
            })),
          },
        ];

        if (response.stop_reason !== "tool_use") break;
      }

      if (appliedLabels.length > 0) {
        setMessages((prev) => [...prev, { kind: "changes", labels: appliedLabels, undoToIndex: turnStartIndex }]);
      }

      setAnthropicMessages(history);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Errore sconosciuto nella chiamata ad Anthropic.";
      setMessages((prev) => [...prev, { kind: "error", text: message }]);
    } finally {
      setPending(false);
    }
  }, [anthropicMessages, pending]);

  const undoTurn = useCallback((undoToIndex: number) => {
    useDiagramStore.getState().goto(undoToIndex);
  }, []);

  return { messages, pending, sendUserMessage, undoTurn };
}
