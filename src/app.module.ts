import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/infra/database/database.module";
import { StatusModule } from "src/modules/status/status.module";
import { MigrationsModule } from "src/modules/migrations/migrations.module";
import { UsersModule } from "src/modules/users/users.module";

@Module({
  imports: [DatabaseModule, StatusModule, MigrationsModule, UsersModule],
})
export class AppModule {}
