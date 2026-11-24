jest.mock("@nestjs/common", () => {
  const actual = jest.requireActual("@nestjs/common");
  return {
    ...actual,
  };
});

jest.mock("src/common/pipes/zod-validation.pipe", () => ({
  ZodValidationPipe: jest.fn().mockImplementation(() => ({
    transform: jest.fn((value) => value),
  })),
}));

import { UnauthorizedException } from "@nestjs/common";
import { createPostSchema } from "src/modules/posts/dto/create-post.dto";
import { PostsController } from "src/modules/posts/posts.controller";
import type { PostsService } from "src/modules/posts/posts.service";
import type { AuthenticatedRequest } from "src/common/guards/session-auth.guard";

describe("PostsController and createPostSchema", () => {
  test("createPostSchema trims content and enforces length bounds", () => {
    expect(createPostSchema.parse({ content: "  hello  " })).toEqual({
      content: "hello",
    });
    expect(() => createPostSchema.parse({ content: "   " })).toThrow();
    expect(() =>
      createPostSchema.parse({ content: "a".repeat(501) }),
    ).toThrow();
  });

  test("listFeed returns items from service", async () => {
    const items = [{ id: "1", content: "Feed item" }];
    const service = {
      listFeed: jest.fn().mockResolvedValue(items),
    } as unknown as PostsService;

    const controller = new PostsController(service);
    await expect(controller.listFeed()).resolves.toEqual({ items });
  });

  test("search normalizes limit and delegates to searchSimilar", async () => {
    const items = [{ id: "2", content: "Match", similarity: 0.9 }];
    const service = {
      searchSimilar: jest.fn().mockResolvedValue(items),
    } as unknown as PostsService;

    const controller = new PostsController(service);

    await controller.search("nestjs", "99");
    expect(service.searchSimilar).toHaveBeenCalledWith("nestjs", 20);

    await controller.search("nestjs", "-1");
    expect(service.searchSimilar).toHaveBeenCalledWith("nestjs", 5);
  });

  test("ask trims question and normalizes limit", async () => {
    const ragResponse = {
      question: "What is pgvector?",
      answer: "Vector extension for Postgres.",
      sources: [],
    };
    const service = {
      askQuestion: jest.fn().mockResolvedValue(ragResponse),
    } as unknown as PostsService;

    const controller = new PostsController(service);
    await expect(
      controller.ask({ question: "  What is pgvector?  ", limit: 50 }),
    ).resolves.toEqual(ragResponse);
    expect(service.askQuestion).toHaveBeenCalledWith("What is pgvector?", 20);
  });

  test("create throws UnauthorizedException when user context is missing and delegates when present", async () => {
    const created = { id: "post-10", content: "New post" };
    const service = {
      create: jest.fn().mockResolvedValue(created),
    } as unknown as PostsService;

    const controller = new PostsController(service);

    await expect(
      controller.create({} as AuthenticatedRequest, { content: "New post" }),
    ).rejects.toThrow(UnauthorizedException);

    const authReq = {
      auth: { user: { id: "user-42" } },
    } as unknown as AuthenticatedRequest;

    await expect(
      controller.create(authReq, { content: "New post" }),
    ).resolves.toEqual(created);
    expect(service.create).toHaveBeenCalledWith("user-42", {
      content: "New post",
    });
  });
});
