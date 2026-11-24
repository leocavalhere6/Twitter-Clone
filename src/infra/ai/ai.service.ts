import { Injectable } from "@nestjs/common";
import { logger } from "infra/logger";

const EMBEDDING_DIMENSIONS = 768;
const GEMINI_EMBED_MODEL = "text-embedding-004";
const GEMINI_CHAT_MODEL = "gemini-2.5-flash";

@Injectable()
export class AiService {
  private readonly apiKey = process.env.GEMINI_API_KEY;

  private buildFallbackEmbedding(text: string): number[] {
    const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
    const normalized = text.toLowerCase().trim();

    for (let i = 0; i < normalized.length; i++) {
      const code = normalized.charCodeAt(i);
      const bucket = (code * 31 + i * 17) % EMBEDDING_DIMENSIONS;
      vector[bucket] += ((code % 29) + 1) / 29;
    }

    const magnitude = Math.sqrt(
      vector.reduce((sum, value) => sum + value * value, 0),
    );
    if (magnitude === 0) {
      vector[0] = 1;
      return vector;
    }

    return vector.map((value) => Number((value / magnitude).toFixed(6)));
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const cleaned = text.trim();
    if (!cleaned) {
      return this.buildFallbackEmbedding("empty");
    }

    if (!this.apiKey) {
      return this.buildFallbackEmbedding(cleaned);
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_EMBED_MODEL}:embedContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: `models/${GEMINI_EMBED_MODEL}`,
          content: { parts: [{ text: cleaned }] },
        }),
      });

      if (!response.ok) {
        logger.warn(
          { status: response.status },
          "Gemini embedding request failed; using deterministic fallback.",
        );
        return this.buildFallbackEmbedding(cleaned);
      }

      const data = (await response.json()) as {
        embedding?: { values?: number[] };
      };
      const values = data.embedding?.values;
      if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
        return this.buildFallbackEmbedding(cleaned);
      }

      return values;
    } catch (error) {
      logger.warn(
        { err: error },
        "Error calling Gemini embedding API; using fallback.",
      );
      return this.buildFallbackEmbedding(cleaned);
    }
  }

  async generateRagAnswer(
    question: string,
    contexts: string[],
  ): Promise<string> {
    if (contexts.length === 0) {
      return "No relevant posts were found to answer based on current context.";
    }

    if (!this.apiKey) {
      return `Based on matching posts: ${contexts.slice(0, 3).join(" | ")}`;
    }

    const prompt = [
      "Answer concisely in English using ONLY the provided post excerpts as context.",
      "If the context does not contain enough information, state that clearly.",
      "",
      "Post context:",
      ...contexts.map((ctx, idx) => `[${idx + 1}] ${ctx}`),
      "",
      `Question: ${question}`,
    ].join("\n");

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CHAT_MODEL}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        return `Based on matching posts: ${contexts.slice(0, 3).join(" | ")}`;
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      };

      const answer =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      return (
        answer || `Based on matching posts: ${contexts.slice(0, 3).join(" | ")}`
      );
    } catch (error) {
      logger.warn(
        { err: error },
        "Error calling Gemini RAG generation API; using context summary.",
      );
      return `Based on matching posts: ${contexts.slice(0, 3).join(" | ")}`;
    }
  }
}
