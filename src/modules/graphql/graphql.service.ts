import { Inject, Injectable } from "@nestjs/common";
import { buildSchema, graphql } from "graphql";
import { PostsService } from "src/modules/posts/posts.service";
import { UsersService } from "src/modules/users/users.service";

const schema = buildSchema(`
  type Author {
    id: ID!
    username: String!
    role: String!
  }

  type Post {
    id: ID!
    user_id: ID!
    content: String!
    created_at: String!
    updated_at: String!
    author: Author!
  }

  type SimilarPost {
    id: ID!
    content: String!
    similarity: Float!
    author: Author!
  }

  type RagResponse {
    question: String!
    answer: String!
    sources: [SimilarPost!]!
  }

  type UserProfile {
    id: ID!
    username: String!
    role: String!
    active: Boolean!
    created_at: String!
  }

  type Query {
    feed(limit: Int): [Post!]!
    profile(username: String!): UserProfile!
    searchPosts(query: String!, limit: Int): [SimilarPost!]!
    askPosts(question: String!, limit: Int): RagResponse!
  }
`);

@Injectable()
export class GraphqlService {
  constructor(
    @Inject(PostsService)
    private readonly postsService: PostsService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  async execute(
    query: string,
    variables?: Record<string, unknown>,
    operationName?: string,
  ) {
    const rootValue = {
      feed: async (args: { limit?: number }) => {
        const items = await this.postsService.listFeed();
        return typeof args.limit === "number"
          ? items.slice(0, args.limit)
          : items;
      },
      profile: async (args: { username: string }) => {
        return this.usersService.findOneByUsername(args.username);
      },
      searchPosts: async (args: { query: string; limit?: number }) => {
        return this.postsService.searchSimilar(args.query, args.limit ?? 5);
      },
      askPosts: async (args: { question: string; limit?: number }) => {
        return this.postsService.askQuestion(args.question, args.limit ?? 5);
      },
    };

    return graphql({
      schema,
      source: query,
      rootValue,
      variableValues: variables,
      operationName,
    });
  }
}
