import { Inject, Injectable } from "@nestjs/common";
import { DatabaseService } from "src/infra/database/database.service";

export interface SystemStatusResponse {
  updated_at: string;
  dependencies: {
    database: {
      version: string;
      max_connections: number;
      opened_connections: number;
    };
  };
}

@Injectable()
export class StatusService {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async getStatus(): Promise<SystemStatusResponse> {
    const updatedAt = new Date().toISOString();

    const versionResult = await this.databaseService.query<{
      server_version: string;
    }>("SHOW server_version;");
    const version = versionResult.rows[0].server_version;

    const maxConnResult = await this.databaseService.query<{
      max_connections: string;
    }>("SHOW max_connections;");
    const maxConnections = parseInt(maxConnResult.rows[0].max_connections, 10);

    const databaseName = process.env.POSTGRES_DB;
    const openedConnResult = await this.databaseService.query<{
      count: number;
    }>({
      text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    });
    const openedConnections = openedConnResult.rows[0].count;

    return {
      updated_at: updatedAt,
      dependencies: {
        database: {
          version,
          max_connections: maxConnections,
          opened_connections: openedConnections,
        },
      },
    };
  }
}
