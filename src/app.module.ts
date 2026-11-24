import { Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { DatabaseModule } from "./infra/database/database.module";
import { MailModule } from "./infra/mail/mail.module";
import { MigrationsModule } from "./modules/migrations/migrations.module";
import { StatusModule } from "./modules/status/status.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    DatabaseModule,
    MailModule,
    StatusModule,
    MigrationsModule,
    UsersModule,
  ],
  providers: [Reflector],
})
export class AppModule {}
