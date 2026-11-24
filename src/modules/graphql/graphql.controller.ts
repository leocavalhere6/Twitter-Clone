import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
} from "@nestjs/common";
import { GraphqlService } from "./graphql.service";

interface GraphqlRequestBody {
  query?: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

@Controller("graphql")
export class GraphqlController {
  constructor(
    @Inject(GraphqlService)
    private readonly graphqlService: GraphqlService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handlePost(@Body() body: GraphqlRequestBody) {
    return this.graphqlService.execute(
      body?.query ?? "",
      body?.variables,
      body?.operationName,
    );
  }

  @Get()
  async handleGet(
    @Query("query") query?: string,
    @Query("operationName") operationName?: string,
  ) {
    return this.graphqlService.execute(
      query ?? "{ feed { id content author { username } } }",
      undefined,
      operationName,
    );
  }
}
