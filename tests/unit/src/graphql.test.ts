jest.mock("@nestjs/common", () => {
  const actual = jest.requireActual("@nestjs/common");
  return {
    ...actual,
  };
});

import { GraphqlController } from "src/modules/graphql/graphql.controller";
import { GraphqlService } from "src/modules/graphql/graphql.service";
import type { PostsService } from "src/modules/posts/posts.service";
import type { UsersService } from "src/modules/users/users.service";

describe("GraphqlService and GraphqlController", () => {
  const samplePosts = [
    {
      id: "p1",
      user_id: "u1",
      content: "First post",
      created_at: "2026-11-24T00:00:00.000Z",
      updated_at: "2026-11-24T00:00:00.000Z",
      author: { id: "u1", username: "leo", role: "user" },
    },
    {
      id: "p2",
      user_id: "u1",
      content: "Second post",
      created_at: "2026-11-24T00:00:00.000Z",
      updated_at: "2026-11-24T00:00:00.000Z",
      author: { id: "u1", username: "leo", role: "user" },
    },
  ];

  test("executes feed, profile, searchPosts, and askPosts queries", async () => {
    const postsService = {
      listFeed: jest.fn().mockResolvedValue(samplePosts),
      searchSimilar: jest.fn().mockResolvedValue([
        {
          ...samplePosts[0],
          similarity: 0.88,
        },
      ]),
      askQuestion: jest.fn().mockResolvedValue({
        question: "Any posts?",
        answer: "Yes.",
        sources: [],
      }),
    } as unknown as PostsService;

    const usersService = {
      findOneByUsername: jest.fn().mockResolvedValue({
        id: "u1",
        username: "leo",
        role: "user",
        active: true,
        created_at: "2026-11-24T00:00:00.000Z",
      }),
    } as unknown as UsersService;

    const service = new GraphqlService(postsService, usersService);

    const feedLimited = await service.execute(
      "{ feed(limit: 1) { id content } }",
    );
    expect(feedLimited.errors).toBeUndefined();
    expect((feedLimited.data as { feed: unknown[] }).feed).toHaveLength(1);

    const profileRes = await service.execute(
      "query GetProfile($username: String!) { profile(username: $username) { username active } }",
      { username: "leo" },
    );
    expect(profileRes.errors).toBeUndefined();
    expect(
      (profileRes.data as { profile: { username: string } }).profile.username,
    ).toBe("leo");

    await service.execute('{ searchPosts(query: "post") { id similarity } }');
    expect(postsService.searchSimilar).toHaveBeenCalledWith("post", 5);

    await service.execute('{ askPosts(question: "Any posts?") { answer } }');
    expect(postsService.askQuestion).toHaveBeenCalledWith("Any posts?", 5);
  });

  test("GraphqlController delegates POST and GET requests", async () => {
    const executeMock = jest.fn().mockResolvedValue({ data: { feed: [] } });
    const graphqlService = {
      execute: executeMock,
    } as unknown as GraphqlService;

    const controller = new GraphqlController(graphqlService);

    await controller.handlePost({
      query: "{ feed { id } }",
      variables: {},
      operationName: undefined,
    });
    expect(executeMock).toHaveBeenCalledWith("{ feed { id } }", {}, undefined);

    await controller.handleGet();
    expect(executeMock).toHaveBeenCalledWith(
      "{ feed { id content author { username } } }",
      undefined,
      undefined,
    );
  });
});
