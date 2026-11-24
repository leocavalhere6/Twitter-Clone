import { PostsRepository } from "src/modules/posts/posts.repository";
import type { DatabaseService } from "src/infra/database/database.service";

describe("PostsRepository", () => {
  test("create inserts post and returns created record", async () => {
    const createdPost = {
      id: "post-1",
      user_id: "user-1",
      content: "Hello world",
      created_at: "2026-11-24T00:00:00.000Z",
      updated_at: "2026-11-24T00:00:00.000Z",
    };
    const returningMock = jest.fn().mockResolvedValue([createdPost]);
    const valuesMock = jest.fn().mockReturnValue({ returning: returningMock });
    const insertMock = jest.fn().mockReturnValue({ values: valuesMock });

    const dbService = {
      db: { insert: insertMock },
    } as unknown as DatabaseService;

    const repo = new PostsRepository(dbService);
    const result = await repo.create("user-1", "Hello world");

    expect(result).toEqual(createdPost);
    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(valuesMock).toHaveBeenCalledWith({
      user_id: "user-1",
      content: "Hello world",
    });
  });

  test("findAllWithAuthor queries feed ordered with default limit", async () => {
    const rows = [
      {
        id: "post-1",
        user_id: "user-1",
        content: "Post content",
        created_at: "2026-11-24T00:00:00.000Z",
        updated_at: "2026-11-24T00:00:00.000Z",
        author: { id: "user-1", username: "leo", role: "user" },
      },
    ];
    const limitMock = jest.fn().mockResolvedValue(rows);
    const orderByMock = jest.fn().mockReturnValue({ limit: limitMock });
    const innerJoinMock = jest.fn().mockReturnValue({ orderBy: orderByMock });
    const fromMock = jest.fn().mockReturnValue({ innerJoin: innerJoinMock });
    const selectMock = jest.fn().mockReturnValue({ from: fromMock });

    const dbService = {
      db: { select: selectMock },
    } as unknown as DatabaseService;

    const repo = new PostsRepository(dbService);
    const result = await repo.findAllWithAuthor();

    expect(result).toEqual(rows);
    expect(limitMock).toHaveBeenCalledWith(50);
  });

  test("updateEmbedding executes vector update query", async () => {
    const executeMock = jest.fn().mockResolvedValue([]);
    const dbService = {
      db: { execute: executeMock },
    } as unknown as DatabaseService;

    const repo = new PostsRepository(dbService);
    await repo.updateEmbedding(
      "11111111-1111-1111-1111-111111111111",
      [0.1, -0.2, 0.3],
    );

    expect(executeMock).toHaveBeenCalledTimes(1);
  });

  test("findSimilarByEmbedding supports both array and { rows } driver results", async () => {
    const matches = [
      {
        id: "post-2",
        user_id: "user-2",
        content: "Vector match",
        created_at: "2026-11-24T00:00:00.000Z",
        updated_at: "2026-11-24T00:00:00.000Z",
        similarity: 0.92,
        author: { id: "user-2", username: "ana", role: "user" },
      },
    ];

    const executeArrayMock = jest.fn().mockResolvedValue(matches);
    const repoArray = new PostsRepository({
      db: { execute: executeArrayMock },
    } as unknown as DatabaseService);
    await expect(
      repoArray.findSimilarByEmbedding([0.5, 0.5], 3),
    ).resolves.toEqual(matches);

    const executeRowsMock = jest.fn().mockResolvedValue({ rows: matches });
    const repoRows = new PostsRepository({
      db: { execute: executeRowsMock },
    } as unknown as DatabaseService);
    await expect(
      repoRows.findSimilarByEmbedding([0.5, 0.5], 3),
    ).resolves.toEqual(matches);
  });
});
