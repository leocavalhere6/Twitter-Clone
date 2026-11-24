import { Inject, Injectable, OnModuleInit } from "@nestjs/common";
import { logger } from "infra/logger";
import { AiService } from "src/infra/ai/ai.service";
import { RabbitMqService } from "src/infra/messaging/rabbitmq.service";
import { MongoDbService } from "src/infra/mongodb/mongodb.service";
import { CreatePostDto } from "./dto/create-post.dto";
import {
  PostsRepository,
  PostWithAuthor,
  SimilarPostMatch,
} from "./posts.repository";

export interface RagAnswerResult {
  question: string;
  answer: string;
  sources: SimilarPostMatch[];
}

const MAX_CONSUMER_START_ATTEMPTS = 10;
const CONSUMER_RETRY_DELAY_MS = 500;

@Injectable()
export class PostsService implements OnModuleInit {
  constructor(
    @Inject(PostsRepository)
    private readonly postsRepository: PostsRepository,
    @Inject(RabbitMqService)
    private readonly rabbitMqService: RabbitMqService,
    @Inject(MongoDbService)
    private readonly mongoDbService: MongoDbService,
    @Inject(AiService)
    private readonly aiService: AiService,
  ) {}

  private async indexPostEmbedding(
    postId: string,
    content: string,
  ): Promise<void> {
    const embedding = await this.aiService.generateEmbedding(content);
    await this.postsRepository.updateEmbedding(postId, embedding);
  }

  async onModuleInit(): Promise<void> {
    for (let attempt = 1; attempt <= MAX_CONSUMER_START_ATTEMPTS; attempt++) {
      try {
        await this.rabbitMqService.consumePostCreated(async (event) => {
          await this.indexPostEmbedding(event.postId, event.content);

          logger.info(
            { postId: event.postId, userId: event.userId },
            "Generated and stored post embedding asynchronously.",
          );
        });
        return;
      } catch (error) {
        logger.warn(
          { err: error, attempt },
          "Waiting for RabbitMQ before starting post.created consumer.",
        );
        await new Promise((resolve) =>
          setTimeout(resolve, CONSUMER_RETRY_DELAY_MS),
        );
      }
    }

    logger.warn(
      "Could not start post.created consumer after maximum retry attempts.",
    );
  }

  async create(userId: string, dto: CreatePostDto) {
    const createdPost = await this.postsRepository.create(userId, dto.content);

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

    try {
      await this.indexPostEmbedding(createdPost.id, createdPost.content);
    } catch (error) {
      logger.warn(
        { err: error, postId: createdPost.id },
        "Inline embedding indexing skipped; relying on async consumer.",
      );
    }

    return createdPost;
  }

  async listFeed(): Promise<PostWithAuthor[]> {
    return this.postsRepository.findAllWithAuthor();
  }

  async searchSimilar(query: string, limit = 5): Promise<SimilarPostMatch[]> {
    const queryEmbedding = await this.aiService.generateEmbedding(query);
    return this.postsRepository.findSimilarByEmbedding(queryEmbedding, limit);
  }

  async askQuestion(question: string, limit = 5): Promise<RagAnswerResult> {
    const matches = await this.searchSimilar(question, limit);
    const contexts = matches.map(
      (match) => `@${match.author.username}: ${match.content}`,
    );
    const answer = await this.aiService.generateRagAnswer(question, contexts);

    return {
      question,
      answer,
      sources: matches,
    };
  }
}
