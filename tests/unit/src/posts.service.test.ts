import { logger } from "infra/logger";
import { AiService } from "src/infra/ai/ai.service";
import { RabbitMqService } from "src/infra/messaging/rabbitmq.service";
import { MongoDbService } from "src/infra/mongodb/mongodb.service";
import { PostsRepository } from "src/modules/posts/posts.repository";
import { PostsService } from "src/modules/posts/posts.service";

describe("PostsService", () => {
  beforeAll(() => {
    jest.spyOn(logger, "info").mockImplementation(() => logger);
    jest.spyOn(logger, "warn").mockImplementation(() => logger);
    jest.spyOn(logger, "error").mockImplementation(() => logger);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const mockRepository = {
    create: jest.fn(),
    findAllWithAuthor: jest.fn(),
    updateEmbedding: jest.fn().mockResolvedValue(undefined),
    findSimilarByEmbedding: jest.fn().mockResolvedValue([]),
  };

  const mockRabbitMq = {
    publishPostCreated: jest.fn().mockResolvedValue(undefined),
    consumePostCreated: jest.fn().mockResolvedValue(undefined),
  };

  const mockMongoDb = {
    recordActivity: jest.fn().mockResolvedValue(undefined),
    createNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockAiService = {
    generateEmbedding: jest.fn().mockResolvedValue(new Array(768).fill(0)),
    generateRagAnswer: jest.fn().mockResolvedValue("Mocked RAG answer"),
  };

  let service: PostsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository.updateEmbedding.mockResolvedValue(undefined);
    mockRepository.findSimilarByEmbedding.mockResolvedValue([]);
    mockRabbitMq.publishPostCreated.mockResolvedValue(undefined);
    mockRabbitMq.consumePostCreated.mockResolvedValue(undefined);
    mockMongoDb.recordActivity.mockResolvedValue(undefined);
    mockAiService.generateEmbedding.mockResolvedValue(new Array(768).fill(0));
    mockAiService.generateRagAnswer.mockResolvedValue("Mocked RAG answer");

    service = new PostsService(
      mockRepository as unknown as PostsRepository,
      mockRabbitMq as unknown as RabbitMqService,
      mockMongoDb as unknown as MongoDbService,
      mockAiService as unknown as AiService,
    );
  });

  test("create persists post, publishes post.created event, and records MongoDB activity", async () => {
    const fakePost = {
      id: "post-123",
      user_id: "user-456",
      content: "Hello modular monolith!",
      created_at: "2026-11-24T00:00:00.000Z",
      updated_at: "2026-11-24T00:00:00.000Z",
    };

    mockRepository.create.mockResolvedValue(fakePost);

    const result = await service.create("user-456", {
      content: "Hello modular monolith!",
    });

    expect(result).toEqual(fakePost);
    expect(mockRepository.create).toHaveBeenCalledWith(
      "user-456",
      "Hello modular monolith!",
    );
    expect(mockRabbitMq.publishPostCreated).toHaveBeenCalledWith({
      postId: "post-123",
      userId: "user-456",
      content: "Hello modular monolith!",
      createdAt: "2026-11-24T00:00:00.000Z",
    });
    expect(mockMongoDb.recordActivity).toHaveBeenCalledWith({
      type: "post.created",
      actorId: "user-456",
      targetId: "post-123",
      metadata: {
        contentLength: "Hello modular monolith!".length,
      },
    });
    expect(mockAiService.generateEmbedding).toHaveBeenCalledWith(
      "Hello modular monolith!",
    );
    expect(mockRepository.updateEmbedding).toHaveBeenCalledWith(
      "post-123",
      new Array(768).fill(0),
    );
  });

  test("create still returns post when broker, MongoDB, or inline embedding fails", async () => {
    const fakePost = {
      id: "post-789",
      user_id: "user-456",
      content: "Resilient post",
      created_at: "2026-11-24T00:00:00.000Z",
      updated_at: "2026-11-24T00:00:00.000Z",
    };

    mockRepository.create.mockResolvedValue(fakePost);
    mockRabbitMq.publishPostCreated.mockRejectedValue(new Error("AMQP down"));
    mockMongoDb.recordActivity.mockRejectedValue(new Error("Mongo down"));
    mockAiService.generateEmbedding.mockRejectedValue(new Error("AI timeout"));

    await expect(
      service.create("user-456", { content: "Resilient post" }),
    ).resolves.toEqual(fakePost);
  });

  test("listFeed delegates to PostsRepository.findAllWithAuthor", async () => {
    const feed = [
      {
        id: "post-1",
        user_id: "user-1",
        content: "First post",
        created_at: "2026-11-24T00:00:00.000Z",
        updated_at: "2026-11-24T00:00:00.000Z",
        author: { id: "user-1", username: "leo_dev", role: "user" },
      },
    ];
    mockRepository.findAllWithAuthor.mockResolvedValue(feed);

    await expect(service.listFeed()).resolves.toEqual(feed);
  });

  test("onModuleInit registers consumer and indexes embedding on incoming event", async () => {
    let registeredHandler:
      | ((event: {
          postId: string;
          userId: string;
          content: string;
        }) => Promise<void>)
      | undefined;

    mockRabbitMq.consumePostCreated.mockImplementation(async (cb) => {
      registeredHandler = cb;
    });

    await service.onModuleInit();
    expect(mockRabbitMq.consumePostCreated).toHaveBeenCalledTimes(1);

    await registeredHandler?.({
      postId: "post-ev-1",
      userId: "user-ev-1",
      content: "Async event content",
    });

    expect(mockAiService.generateEmbedding).toHaveBeenCalledWith(
      "Async event content",
    );
    expect(mockRepository.updateEmbedding).toHaveBeenCalledWith(
      "post-ev-1",
      new Array(768).fill(0),
    );
  });

  test("onModuleInit logs warning after exhausting retry attempts when broker fails", async () => {
    jest.useFakeTimers();
    mockRabbitMq.consumePostCreated.mockRejectedValue(new Error("Not ready"));

    const initPromise = service.onModuleInit();
    await jest.advanceTimersByTimeAsync(10 * 500);
    await initPromise;

    expect(mockRabbitMq.consumePostCreated).toHaveBeenCalledTimes(10);
    jest.useRealTimers();
  });

  test("searchSimilar and askQuestion return matches and RAG answer", async () => {
    const matches = [
      {
        id: "post-1",
        user_id: "user-1",
        content: "NestJS and pgvector",
        created_at: "2026-11-24T00:00:00.000Z",
        updated_at: "2026-11-24T00:00:00.000Z",
        similarity: 0.95,
        author: { id: "user-1", username: "leo_dev", role: "user" },
      },
    ];
    mockRepository.findSimilarByEmbedding.mockResolvedValue(matches);
    mockAiService.generateRagAnswer.mockResolvedValue(
      "Use pgvector in Postgres.",
    );

    const similar = await service.searchSimilar("pgvector", 3);
    expect(similar).toEqual(matches);
    expect(mockRepository.findSimilarByEmbedding).toHaveBeenCalledWith(
      new Array(768).fill(0),
      3,
    );

    const rag = await service.askQuestion("How does search work?", 3);
    expect(rag).toEqual({
      question: "How does search work?",
      answer: "Use pgvector in Postgres.",
      sources: matches,
    });
    expect(mockAiService.generateRagAnswer).toHaveBeenCalledWith(
      "How does search work?",
      ["@leo_dev: NestJS and pgvector"],
    );
  });
});
