import { Module } from "@nestjs/common";
import { PostsModule } from "src/modules/posts/posts.module";
import { UsersModule } from "src/modules/users/users.module";
import { GraphqlController } from "./graphql.controller";
import { GraphqlService } from "./graphql.service";

@Module({
  imports: [PostsModule, UsersModule],
  controllers: [GraphqlController],
  providers: [GraphqlService],
})
export class GraphqlModule {}
