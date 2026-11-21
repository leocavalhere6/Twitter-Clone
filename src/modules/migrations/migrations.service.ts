import { Inject, Injectable } from "@nestjs/common";
import { resolve } from "node:path";
import migrationRunner from "node-pg-migrate";
import { Client } from "pg";
import { DatabaseService } from "src/infra/database/database.service";

@Injectable()
export class MigrationsService {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  private buildOptions(dryRun: boolean, dbClient: Client) {
    return {
      dryRun,
      dir: resolve("infra", "migrations"),
      direction: "up" as const,
      verbose: true,
      log: (): void => {},
      migrationsTable: "pgmigrations",
      dbClient,
    };
  }

  async listPendingMigrations() {
    let dbClient: Client | undefined;
    try {
      dbClient = await this.databaseService.getNewClient();
      return await migrationRunner(this.buildOptions(true, dbClient));
    } finally {
      await dbClient?.end();
    }
  }

  async runPendingMigrations() {
    let dbClient: Client | undefined;
    try {
      dbClient = await this.databaseService.getNewClient();
      return await migrationRunner(this.buildOptions(false, dbClient));
    } finally {
      await dbClient?.end();
    }
  }
}
