import { Injectable, OnModuleDestroy } from "@nestjs/common";
import amqp, { Channel, ChannelModel } from "amqplib";
import { logger } from "infra/logger";

export interface PostCreatedEvent {
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

const DEFAULT_EXCHANGE = "tabnews.events";
const POST_CREATED_QUEUE = "posts.created.queue";
const POST_CREATED_ROUTING_KEY = "post.created";

@Injectable()
export class RabbitMqService implements OnModuleDestroy {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;

  private async getChannel(): Promise<Channel | null> {
    if (this.channel) {
      return this.channel;
    }

    const url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";

    try {
      this.connection = await amqp.connect(url);
      this.connection.on("error", (err) => {
        logger.warn({ err }, "RabbitMQ connection error.");
      });
      this.channel = await this.connection.createChannel();
      this.channel.on("error", (err) => {
        logger.warn({ err }, "RabbitMQ channel error.");
      });
      await this.channel.assertExchange(DEFAULT_EXCHANGE, "topic", {
        durable: true,
      });
      return this.channel;
    } catch (error) {
      logger.warn(
        { err: error, url },
        "RabbitMQ unavailable; skipping broker operation.",
      );
      this.channel = null;
      this.connection = null;
      return null;
    }
  }

  async publishPostCreated(event: PostCreatedEvent): Promise<void> {
    const channel = await this.getChannel();
    if (!channel) {
      return;
    }

    const payload = Buffer.from(JSON.stringify(event));
    channel.publish(DEFAULT_EXCHANGE, POST_CREATED_ROUTING_KEY, payload, {
      persistent: true,
      contentType: "application/json",
    });
  }

  async consumePostCreated(
    handler: (event: PostCreatedEvent) => Promise<void> | void,
  ): Promise<void> {
    const channel = await this.getChannel();
    if (!channel) {
      return;
    }

    await channel.assertQueue(POST_CREATED_QUEUE, { durable: true });
    await channel.bindQueue(
      POST_CREATED_QUEUE,
      DEFAULT_EXCHANGE,
      POST_CREATED_ROUTING_KEY,
    );

    await channel.consume(POST_CREATED_QUEUE, async (msg) => {
      if (!msg) {
        return;
      }

      try {
        const parsed = JSON.parse(
          msg.content.toString("utf8"),
        ) as PostCreatedEvent;
        await handler(parsed);
        channel.ack(msg);
      } catch (error) {
        logger.error({ err: error }, "Failed to process post.created message.");
        channel.nack(msg, false, false);
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
