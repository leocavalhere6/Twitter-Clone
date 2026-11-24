import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { DatabaseModule } from "./infra/database/database.module";
import { MailModule } from "./infra/mail/mail.module";
import { MessagingModule } from "./infra/messaging/messaging.module";
import { MongoDbModule } from "./infra/mongodb/mongodb.module";
import { MigrationsModule } from "./modules/migrations/migrations.module";
import { PostsModule } from "./modules/posts/posts.module";
import { StatusModule } from "./modules/status/status.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    DatabaseModule,
    MailModule,
    MessagingModule,
    MongoDbModule,
    StatusModule,
    MigrationsModule,
    UsersModule,
    PostsModule,
  ],
  providers: [Reflector],
})
export class AppModule {}
