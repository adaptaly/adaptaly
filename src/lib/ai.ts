type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

const AIML_API_BASE = process.env.AIML_API_BASE || "https://api.aimlapi.com/v1";
const AIML_API_KEY = process.env.AIML_API_KEY!;
if (!AIML_API_KEY) console.warn("AIML_API_KEY is missing");

export type ChatParams = {
  model: string;
  system?: string;
  messages: ChatMsg[];
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
};

export async function chatCompletion({
  model,
  system,
  messages,
  temperature = 0.2,
  max_tokens = 500,
  stop,
}: ChatParams): Promise<{
  text: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}> {
  const payload: any = {
    model,
    messages: system ? [{ role: "system", content: system }, ...messages] : messages,
    temperature,
    max_tokens,
  };
  if (stop?.length) payload.stop = stop;

  const res = await fetch(`${AIML_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIML_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`AI error ${res.status}: ${err || res.statusText}`);
  }

  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? "";
  const usage = data?.usage;
  return { text, usage };
}