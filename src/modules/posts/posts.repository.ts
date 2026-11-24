import { Inject, Injectable } from "@nestjs/common";
import { desc, eq } from "drizzle-orm";
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
}
