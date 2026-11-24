import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { logger } from "infra/logger";
import { RabbitMqService } from "src/infra/messaging/rabbitmq.service";
import { MongoDbService } from "src/infra/mongodb/mongodb.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { PostsRepository, PostWithAuthor } from "./posts.repository";

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    @Inject(PostsRepository)
    private readonly postsRepository: PostsRepository,
    @Inject(RabbitMqService)
    private readonly rabbitMqService: RabbitMqService,
    @Inject(MongoDbService)
    private readonly mongoDbService: MongoDbService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitMqService
      .consumePostCreated(async (event) => {
        logger.info(
          { postId: event.postId, userId: event.userId },
          "Consumed post.created event for background processing.",
        );
      })
      .catch((error) => {
        logger.warn(
          { err: error },
          "Could not start post.created consumer on init.",
        );
      });
  }

  async create(userId: string, dto: CreatePostDto) {
    const createdPost = await this.postsRepository.create(userId, dto.content);

    // Non-blocking event publication and MongoDB audit log.
    await Promise.allSettled([
      this.rabbitMqService.publishPostCreated({
        postId: createdPost.id,
        userId: createdPost.user_id,
        content: createdPost.content,
        createdAt: createdPost.created_at,
      }),
      this.mongoDbService.recordActivity({
        type: "post.created",
        actorId: createdPost.user_id,
        targetId: createdPost.id,
        metadata: {
          contentLength: createdPost.content.length,
        },
      }),
    ]);

    return createdPost;
  }

  async listFeed(): Promise<PostWithAuthor[]> {
    return this.postsRepository.findAllWithAuthor();
  }
}
