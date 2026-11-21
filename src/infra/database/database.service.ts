import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client, Pool, QueryConfig, QueryResult, QueryResultRow } from "pg";
import * as schema from "models/schema";
import { ServiceError } from "infra/errors.js";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  public readonly db: NodePgDatabase<typeof schema>;

  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      user: process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      ssl: this.getSSLConfig(),
      max: 1,
    });

    this.db = drizzle(this.pool, { schema });
  }

  private getSSLConfig(): boolean | { ca: string } {
    if (process.env.POSTGRES_CA) {
      return { ca: process.env.POSTGRES_CA };
    }
    return process.env.NODE_ENV === "production";
  }

  async query<R extends QueryResultRow = Record<string, unknown>>(
    queryObject: string | QueryConfig,
  ): Promise<QueryResult<R>> {
    let client: Client | undefined;
    try {
      client = await this.getNewClient();
      return await client.query<R>(queryObject);
    } catch (error) {
      throw new ServiceError({
        message: "Erro na conexao com banco de dados ou na Query.",
        cause: error,
      });
    } finally {
      await client?.end();
    }
  }

  async getNewClient(): Promise<Client> {
    const client = new Client({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      user: process.env.POSTGRES_USER,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      ssl: this.getSSLConfig(),
    });

    await client.connect();
    return client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
