// app/lib/aimlapi.ts
import { AICache } from "./ai-cache";

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
    // Use MVP-style environment variables for compatibility
    this.baseURL = (process.env.AIML_API_BASE || process.env.AIMLAPI_BASE_URL)?.replace(/\/+$/, "") || "https://api.aimlapi.com";
    this.apiKey = process.env.AIML_API_KEY || process.env.AIMLAPI_KEY || "";
    this.model = process.env.AIMLAPI_MODEL || "gpt-4o";
    this.defaultTimeout = 45000; // 45 seconds

    if (!this.apiKey) {
      console.warn("AIML_API_KEY or AIMLAPI_KEY is not configured");
    }
  }

  async chat(
    messages: ChatMessage[],
    options: GenerateOptions = {}
  ): Promise<string> {
    const {
      temperature = 0.2,
      max_tokens = 500, // Reduced to MVP levels for efficiency
      timeout = this.defaultTimeout,
    } = options;

    // Create cache key from messages
    const inputKey = JSON.stringify({ messages, temperature, model: this.model });
    
    // Try to get cached response first
    try {
      const cached = await AICache.get(inputKey, this.model, temperature);
      if (cached) {
        console.log("AI Cache hit - using cached response");
        return cached.response;
      }
    } catch (error) {
      console.warn("Cache lookup failed, proceeding with API call:", error);
    }

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

      // Cache the response and log usage
      try {
        const usage = data.usage;
        if (usage) {
          await AICache.set(inputKey, content, this.model, temperature, usage);
          await AICache.logUsage(this.model, "chat", usage);
        } else {
          await AICache.set(inputKey, content, this.model, temperature);
        }
      } catch (error) {
        console.warn("Failed to cache response:", error);
      }

      return content;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async generateSummary(text: string, filename: string): Promise<SummaryResponse> {
    // Create cache key for the entire summary generation
    const summaryInputKey = JSON.stringify({ 
      text: text.slice(0, 1000), // First 1000 chars for cache key
      filename,
      chunks: this.chunkText(text, 6000).length,
      operation: "generateSummary" 
    });
    
    // Try cache first
    try {
      const cached = await AICache.get(summaryInputKey, this.model, 0.2);
      if (cached) {
        console.log("AI Cache hit for summary generation");
        return this.parseJsonResponse<SummaryResponse>(cached.response, {
          summary: this.createFallbackSummary([]),
          flashcards: this.createFallbackFlashcards([]),
        });
      }
    } catch (error) {
      console.warn("Summary cache lookup failed:", error);
    }

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
    ], { temperature: 0.1, max_tokens: 1000 }); // Reduced for efficiency like MVP

    // Cache the final result for future use
    try {
      await AICache.set(summaryInputKey, finalJsonText, this.model, 0.1);
      await AICache.logUsage(this.model, "generateSummary", {
        prompt_tokens: 0, // Approximate values since we don't have exact usage from nested calls
        completion_tokens: Math.floor(finalJsonText.length / 4), // Rough estimate
        total_tokens: Math.floor(finalJsonText.length / 4),
      });
    } catch (error) {
      console.warn("Failed to cache summary:", error);
    }

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