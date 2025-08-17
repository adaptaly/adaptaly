// AI response caching system like MVP
import { createHash } from "crypto";
import { createServerClient } from "@/src/lib/supabaseServer";

interface CacheOptions {
  ttlHours?: number; // Time to live in hours
}

interface CachedResponse {
  response: string;
  created_at: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class AICache {
  private static async getSupabase() {
    return await createServerClient();
  }

  /**
   * Generate a cache key from input parameters
   */
  private static generateCacheKey(input: string, model: string, temperature: number): string {
    const keyData = `${input}:${model}:${temperature}`;
    return createHash("sha256").update(keyData).digest("hex");
  }

  /**
   * Get cached AI response
   */
  static async get(
    input: string, 
    model: string = "gpt-4o", 
    temperature: number = 0.2
  ): Promise<CachedResponse | null> {
    try {
      const supabase = await this.getSupabase();
      const cacheKey = this.generateCacheKey(input, model, temperature);

      const { data, error } = await supabase
        .from("ai_cache")
        .select("response, created_at, prompt_tokens, completion_tokens, total_tokens")
        .eq("cache_key", cacheKey)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // 24 hour TTL
        .single();

      if (error || !data) {
        if (error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
          console.warn("⚠️ AI cache table does not exist - caching disabled");
        }
        return null;
      }

      return {
        response: data.response,
        created_at: data.created_at,
        usage: data.prompt_tokens ? {
          prompt_tokens: data.prompt_tokens,
          completion_tokens: data.completion_tokens,
          total_tokens: data.total_tokens,
        } : undefined,
      };
    } catch (error) {
      console.warn("⚠️ Error reading from AI cache (table may not exist):", error);
      return null;
    }
  }

  /**
   * Store AI response in cache
   */
  static async set(
    input: string,
    response: string,
    model: string = "gpt-4o",
    temperature: number = 0.2,
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    }
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase();
      const cacheKey = this.generateCacheKey(input, model, temperature);

      await supabase
        .from("ai_cache")
        .upsert({
          cache_key: cacheKey,
          model,
          temperature,
          input_hash: this.generateCacheKey(input, "", 0), // Simple input hash for debugging
          response,
          prompt_tokens: usage?.prompt_tokens || null,
          completion_tokens: usage?.completion_tokens || null,
          total_tokens: usage?.total_tokens || null,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      if (error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
        console.warn("⚠️ AI cache table does not exist - caching disabled. Run database_ai_cache.sql to enable caching.");
      } else {
        console.warn("⚠️ Error storing to AI cache:", error);
      }
      // Don't throw - caching should be non-blocking
    }
  }

  /**
   * Log usage for monitoring
   */
  static async logUsage(
    model: string,
    operation: string,
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    }
  ): Promise<void> {
    try {
      const supabase = await this.getSupabase();

      await supabase
        .from("usage_logs")
        .insert({
          model,
          operation,
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      if (error?.message?.includes("relation") || error?.message?.includes("does not exist")) {
        console.warn("⚠️ Usage logs table does not exist - usage tracking disabled. Run database_ai_cache.sql to enable tracking.");
      } else {
        console.warn("⚠️ Error logging usage:", error);
      }
      // Don't throw - logging should be non-blocking
    }
  }

  /**
   * Clean old cache entries
   */
  static async cleanup(olderThanHours: number = 168): Promise<void> { // 7 days default
    try {
      const supabase = await this.getSupabase();
      const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000).toISOString();

      await supabase
        .from("ai_cache")
        .delete()
        .lt("created_at", cutoff);
    } catch (error) {
      console.error("Error cleaning cache:", error);
    }
  }
}