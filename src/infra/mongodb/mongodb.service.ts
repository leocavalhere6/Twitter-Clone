import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Collection, Db, MongoClient } from "mongodb";
import { logger } from "infra/logger";

export interface ActivityLogDocument {
  type: string;
  actorId?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationDocument {
  recipientId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

@Injectable()
export class MongoDbService implements OnModuleDestroy {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  private async getDb(): Promise<Db | null> {
    if (this.db) {
      return this.db;
    }

    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const dbName = process.env.MONGODB_DB_NAME || "tabnews";

    try {
      this.client = new MongoClient(uri, { serverSelectionTimeoutMS: 1500 });
      await this.client.connect();
      this.db = this.client.db(dbName);
      return this.db;
    } catch (error) {
      logger.warn(
        { err: error, uri },
        "MongoDB unavailable; skipping non-blocking document write.",
      );
      this.db = null;
      this.client = null;
      return null;
    }
  }

  private async getCollection<T extends object>(
    name: string,
  ): Promise<Collection<T> | null> {
    const database = await this.getDb();
    if (!database) {
      return null;
    }
    return database.collection<T>(name);
  }

  async recordActivity(
    entry: Omit<ActivityLogDocument, "createdAt">,
  ): Promise<void> {
    const collection =
      await this.getCollection<ActivityLogDocument>("activity_logs");
    if (!collection) {
      return;
    }

    await collection
      .insertOne({
        ...entry,
        createdAt: new Date().toISOString(),
      })
      .catch((error) => {
        logger.warn(
          { err: error },
          "Failed to insert activity log in MongoDB.",
        );
      });
  }

  async createNotification(
    entry: Omit<NotificationDocument, "read" | "createdAt">,
  ): Promise<void> {
    const collection =
      await this.getCollection<NotificationDocument>("notifications");
    if (!collection) {
      return;
    }

    await collection
      .insertOne({
        ...entry,
        read: false,
        createdAt: new Date().toISOString(),
      })
      .catch((error) => {
        logger.warn(
          { err: error },
          "Failed to insert notification in MongoDB.",
        );
      });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.close().catch(() => undefined);
  }
}
