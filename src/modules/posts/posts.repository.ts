import { Inject, Injectable } from "@nestjs/common";
import { desc, eq, sql } from "drizzle-orm";
import { Post, posts, users } from "models/schema";
import { DatabaseService } from "src/infra/database/database.service";

export interface PostWithAuthor {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    username: string;
    role: string;
  };
}

export interface SimilarPostMatch extends PostWithAuthor {
  similarity: number;
}

function formatVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

@Injectable()
export class PostsRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async create(userId: string, content: string): Promise<Post> {
    const [created] = await this.databaseService.db
      .insert(posts)
      .values({
        user_id: userId,
        content,
      })
      .returning();

    return created;
  }

  async findAllWithAuthor(limit = 50): Promise<PostWithAuthor[]> {
    return this.databaseService.db
      .select({
        id: posts.id,
        user_id: posts.user_id,
        content: posts.content,
        created_at: posts.created_at,
        updated_at: posts.updated_at,
        author: {
          id: users.id,
          username: users.username,
          role: users.role,
        },
      })
      .from(posts)
      .innerJoin(users, eq(posts.user_id, users.id))
      .orderBy(desc(posts.created_at))
      .limit(limit);
  }

  async updateEmbedding(postId: string, embedding: number[]): Promise<void> {
    const vectorLiteral = formatVectorLiteral(embedding);
    await this.databaseService.db.execute(
      sql`UPDATE posts SET embedding = ${vectorLiteral}::vector WHERE id = ${postId}::uuid`,
    );
  }

  async findSimilarByEmbedding(
    embedding: number[],
    limit = 5,
  ): Promise<SimilarPostMatch[]> {
    const vectorLiteral = formatVectorLiteral(embedding);
    const result = await this.databaseService.db.execute(
      sql`
        SELECT
          p.id,
          p.user_id,
          p.content,
          p.created_at,
          p.updated_at,
          COALESCE(1 - (p.embedding <=> ${vectorLiteral}::vector), 0)::float AS similarity,
          json_build_object(
            'id', u.id,
            'username', u.username,
            'role', u.role
          ) AS author
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        WHERE p.embedding IS NOT NULL
        ORDER BY p.embedding <=> ${vectorLiteral}::vector ASC
        LIMIT ${limit}
      `,
    );

    const rows = Array.isArray(result) ? result : (result.rows ?? []);
    return rows as unknown as SimilarPostMatch[];
  }
}
