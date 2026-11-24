import { AiService } from "src/infra/ai/ai.service";
import { RabbitMqService } from "src/infra/messaging/rabbitmq.service";
import { MongoDbService } from "src/infra/mongodb/mongodb.service";
import { PostsRepository } from "src/modules/posts/posts.repository";
import { PostsService } from "src/modules/posts/posts.service";

describe("PostsService", () => {
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
});
