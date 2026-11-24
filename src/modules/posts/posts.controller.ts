import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
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
