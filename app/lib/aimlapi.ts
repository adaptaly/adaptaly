// app/lib/aimlapi.ts
export interface AIMLResponse<T = unknown> {
  choices: Array<{
    message: {
      content: string;
      role: "assistant";
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GenerateOptions {
  temperature?: number;
  max_tokens?: number;
  timeout?: number;
}

export interface Flashcard {
  question: string;
  answer: string;
  hint?: string;
}

export interface SummaryResponse {
  summary: string;
  flashcards: Flashcard[];
}

class AIMLAPIClient {
  private readonly baseURL: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly defaultTimeout: number;

  constructor() {
    this.baseURL = process.env.AIMLAPI_BASE_URL?.replace(/\/+$/, "") || "https://api.aimlapi.com";
    this.apiKey = process.env.AIMLAPI_KEY || "";
    this.model = process.env.AIMLAPI_MODEL || "gpt-4o";
    this.defaultTimeout = 45000; // 45 seconds

    if (!this.apiKey) {
      console.warn("AIMLAPI_KEY is not configured");
    }
  }

  async chat(
    messages: ChatMessage[],
    options: GenerateOptions = {}
  ): Promise<string> {
    const {
      temperature = 0.2,
      max_tokens = 4000,
      timeout = this.defaultTimeout,
    } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(`AIMLAPI error ${response.status}: ${errorText || response.statusText}`);
      }

      const data: AIMLResponse = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim() ?? "";
      
      if (!content) {
        throw new Error("Empty response from AIMLAPI");
      }

      return content;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generateSummary(text: string, filename: string): Promise<SummaryResponse> {
    const chunks = this.chunkText(text, 6000);
    
    // Map: summarize each chunk to bullets
    const bullets: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const bulletResponse = await this.chat([
        {
          role: "system",
          content: "You summarize text into short, factual bullet points. Use concise, plain language.",
        },
        {
          role: "user",
          content: `TEXT (part ${i + 1}/${chunks.length}, from ${filename}):\n\n${
            chunks[i]
          }\n\nWrite 3-6 concise bullets capturing key points. Output plain bullets, no numbering.`,
        },
      ], { temperature: 0.2 });

      bulletResponse
        .split(/\n+/)
        .map((l) => l.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean)
        .forEach((b) => bullets.push(b));
    }

    // Reduce: produce final summary & flashcards
    const finalJsonText = await this.chat([
      {
        role: "system",
        content: "You are an assistant that returns STRICT JSON. No markdown fences, no commentary.",
      },
      {
        role: "user",
        content:
          `From the following bullet points, create:\n` +
          `1) "summary": a readable summary with clear markdown headers (##) and organized sections\n` +
          `2) "flashcards": an array of up to 15 objects { "question": string, "answer": string, "hint"?: string } aimed at recall.\n\n` +
          `Summary Guidelines:\n` +
          `- Use markdown headers (##) to organize content into logical sections\n` +
          `- Create 6-10 clear bullet points under relevant headers\n` +
          `- Make the summary comprehensive yet concise\n` +
          `- Focus on key concepts, definitions, and important details\n\n` +
          `Flashcard Guidelines:\n` +
          `- Create varied question types (What is..., How does..., Why..., etc.)\n` +
          `- Keep answers concise (1–3 sentences)\n` +
          `- Add helpful hints when appropriate\n` +
          `- Focus on testable knowledge and recall\n\n` +
          `JSON only, no extra text.\n\n` +
          `BULLETS:\n` +
          bullets.map((b) => `- ${b}`).join("\n"),
      },
      {
        role: "user",
        content:
          `Return JSON EXACTLY like:\n` +
          `{"summary":"## Main Topic\\n\\nKey points...","flashcards":[{"question":"What is...?","answer":"...","hint":"Think about..."},{"question":"How does...?","answer":"..."}]}`,
      },
    ], { temperature: 0.1, max_tokens: 6000 });

    return this.parseJsonResponse<SummaryResponse>(finalJsonText, {
      summary: this.createFallbackSummary(bullets),
      flashcards: this.createFallbackFlashcards(bullets),
    });
  }

  private chunkText(text: string, maxSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += maxSize) {
      chunks.push(text.slice(i, i + maxSize));
    }
    return chunks;
  }

  private parseJsonResponse<T>(jsonText: string, fallback: T): T {
    // Clean up the response
    const cleaned = jsonText
      .replace(/```json\s*([\s\S]*?)```/gi, "$1")
      .replace(/```([\s\S]*?)```/gi, "$1")
      .trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      // Try to extract JSON from the middle
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(cleaned.slice(start, end + 1)) as T;
        } catch {
          return fallback;
        }
      }
      return fallback;
    }
  }

  private createFallbackSummary(bullets: string[]): string {
    const content = bullets.slice(0, 10).join("\n• ");
    return `## Document Summary\n\n• ${content}`;
  }

  private createFallbackFlashcards(bullets: string[]): Flashcard[] {
    return bullets.slice(0, 8).map((bullet, i) => ({
      question: `What is the key point #${i + 1}?`,
      answer: bullet,
      hint: "Review the main concepts from the document",
    }));
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const aimlapi = new AIMLAPIClient();

// Export fallback functions for when AIMLAPI is not available
export function createLocalSummary(text: string, maxChars = 1300): string {
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  
  if (cleaned.length <= maxChars) return `## Document Content\n\n${cleaned}`;
  
  const slice = cleaned.slice(0, maxChars);
  const lastSentence = Math.max(
    slice.lastIndexOf("."),
    slice.lastIndexOf("!"),
    slice.lastIndexOf("?")
  );
  
  const content = lastSentence > 300 ? slice.slice(0, lastSentence + 1) : slice;
  return `## Document Summary\n\n${content} …`;
}

export function createLocalFlashcards(summary: string, maxCards = 8): Flashcard[] {
  const sentences = summary
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40 && s.length <= 240);
  
  return sentences.slice(0, maxCards).map((s, i) => ({
    question: `What is key concept #${i + 1}?`,
    answer: s,
    hint: "Focus on the main ideas presented in the text",
  }));
}