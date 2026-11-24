import amqp from "amqplib";
import { logger } from "infra/logger";
import { RabbitMqService } from "src/infra/messaging/rabbitmq.service";

jest.mock("amqplib", () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
  },
}));

describe("RabbitMqService", () => {
  const connectMock = amqp.connect as jest.Mock;

  beforeAll(() => {
    jest.spyOn(logger, "info").mockImplementation(() => logger);
    jest.spyOn(logger, "warn").mockImplementation(() => logger);
    jest.spyOn(logger, "error").mockImplementation(() => logger);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("publishPostCreated skips gracefully when RabbitMQ connection fails", async () => {
    connectMock.mockRejectedValueOnce(new Error("Connection refused"));

    const service = new RabbitMqService();
    await expect(
      service.publishPostCreated({
        postId: "p1",
        userId: "u1",
        content: "Test",
        createdAt: "2026-11-24T00:00:00.000Z",
      }),
    ).resolves.toBeUndefined();
  });

  test("publishes event, consumes messages with ack/nack, and closes on destroy", async () => {
    let consumeCallback:
      | ((msg: { content: Buffer } | null) => Promise<void>)
      | undefined;

    const channelMock = {
      on: jest.fn(),
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockReturnValue(true),
      consume: jest.fn().mockImplementation(async (_queue, cb) => {
        consumeCallback = cb;
      }),
      ack: jest.fn(),
      nack: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };

    const connectionMock = {
      on: jest.fn(),
      createChannel: jest.fn().mockResolvedValue(channelMock),
      close: jest.fn().mockResolvedValue(undefined),
    };

    connectMock.mockResolvedValueOnce(connectionMock);

    const service = new RabbitMqService();
    const event = {
      postId: "p2",
      userId: "u2",
      content: "Payload",
      createdAt: "2026-11-24T00:00:00.000Z",
    };

    await service.publishPostCreated(event);
    expect(channelMock.publish).toHaveBeenCalledTimes(1);

    const okHandler = jest.fn().mockResolvedValue(undefined);
    await service.consumePostCreated(okHandler);

    await consumeCallback?.(null);
    await consumeCallback?.({
      content: Buffer.from(JSON.stringify(event), "utf8"),
    });
    expect(okHandler).toHaveBeenCalledWith(event);
    expect(channelMock.ack).toHaveBeenCalledTimes(1);

    await consumeCallback?.({
      content: Buffer.from("invalid-json", "utf8"),
    });
    expect(channelMock.nack).toHaveBeenCalledWith(
      expect.anything(),
      false,
      false,
    );

    await service.onModuleDestroy();
    expect(channelMock.close).toHaveBeenCalledTimes(1);
    expect(connectionMock.close).toHaveBeenCalledTimes(1);
  });
});
