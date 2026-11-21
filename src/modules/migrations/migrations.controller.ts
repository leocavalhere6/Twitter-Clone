import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from "@nestjs/common";
import { MigrationsService } from "./migrations.service";

@Controller("migrations")
export class MigrationsController {
  constructor(
    @Inject(MigrationsService)
    private readonly migrationsService: MigrationsService,
  ) {}

  @Get()
  async listPending() {
    return this.migrationsService.listPendingMigrations();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async runPending() {
    return this.migrationsService.runPendingMigrations();
  }
}
