import { AiService } from "src/infra/ai/ai.service";

describe("AiService", () => {
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalApiKey;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test("generateEmbedding returns a normalized 768-dimension vector using fallback when GEMINI_API_KEY is unset", async () => {
    delete process.env.GEMINI_API_KEY;
    const service = new AiService();

    const embedding = await service.generateEmbedding(
      "Modular monolith with NestJS and pgvector",
    );

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding).toHaveLength(768);
    expect(embedding.some((value) => value !== 0)).toBe(true);
  });

  test("generateRagAnswer returns a clear message when no context posts are provided", async () => {
    const service = new AiService();
    const answer = await service.generateRagAnswer("What is the topic?", []);

    expect(answer).toContain("No relevant posts");
  });

  test("generateRagAnswer uses Gemini API response when configured and successful", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "The posts discuss pgvector and GraphQL." }],
            },
          },
        ],
      }),
    } as Response);

    const service = new AiService();
    const answer = await service.generateRagAnswer("Summarize the posts", [
      "@leo_dev: Using pgvector with PostgreSQL",
    ]);

    expect(answer).toBe("The posts discuss pgvector and GraphQL.");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
