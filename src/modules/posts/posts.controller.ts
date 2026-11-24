import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { RequireFeatures } from "src/common/decorators/require-features.decorator";
import { FeaturesGuard } from "src/common/guards/features.guard";
import {
  type AuthenticatedRequest,
  SessionAuthGuard,
} from "src/common/guards/session-auth.guard";
import { ZodValidationPipe } from "src/common/pipes/zod-validation.pipe";
import { createPostSchema, type CreatePostDto } from "./dto/create-post.dto";
import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
  constructor(
    @Inject(PostsService)
    private readonly postsService: PostsService,
  ) {}

  @Get()
  async listFeed() {
    const items = await this.postsService.listFeed();
    return { items };
  }

  @Get("search")
  async search(@Query("q") query = "", @Query("limit") limitRaw?: string) {
    const parsedLimit = Number(limitRaw);
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 20)
        : 5;
    const items = await this.postsService.searchSimilar(query, limit);
    return { items };
  }

  @Post("ask")
  @HttpCode(HttpStatus.OK)
  async ask(@Body() body: { question?: string; limit?: number }) {
    const question = (body?.question ?? "").trim();
    const limit =
      typeof body?.limit === "number" && body.limit > 0
        ? Math.min(body.limit, 20)
        : 5;
    return this.postsService.askQuestion(question, limit);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SessionAuthGuard, FeaturesGuard)
  @RequireFeatures("create:session")
  @UsePipes(new ZodValidationPipe(createPostSchema))
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreatePostDto,
  ) {
    const userId = request.auth?.user?.id;
    if (!userId) {
      throw new UnauthorizedException({
        name: "UnauthorizedError",
        message: "Authenticated user context is required.",
        action: "Sign in before creating a post.",
        status_code: 401,
      });
    }

    return this.postsService.create(userId, dto);
  }
}
