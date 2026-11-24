import { logger } from "infra/logger";
import { MongoClient } from "mongodb";
import { MongoDbService } from "src/infra/mongodb/mongodb.service";

jest.mock("mongodb", () => ({
  MongoClient: jest.fn(),
}));

describe("MongoDbService", () => {
  const MongoClientMock = MongoClient as unknown as jest.Mock;

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

  test("skips writes gracefully when MongoDB is unreachable", async () => {
    MongoClientMock.mockImplementationOnce(() => ({
      connect: jest.fn().mockRejectedValue(new Error("Timeout")),
      close: jest.fn().mockResolvedValue(undefined),
    }));

    const service = new MongoDbService();
    await expect(
      service.recordActivity({ type: "post.created", actorId: "u1" }),
    ).resolves.toBeUndefined();
    await expect(
      service.createNotification({
        recipientId: "u1",
        type: "mention",
        message: "Hi",
      }),
    ).resolves.toBeUndefined();
  });

  test("records activity and notification and closes client on destroy", async () => {
    const insertOneMock = jest.fn().mockResolvedValue({ insertedId: "1" });
    const collectionMock = jest
      .fn()
      .mockReturnValue({ insertOne: insertOneMock });
    const dbMock = { collection: collectionMock };
    const clientInstance = {
      connect: jest.fn().mockResolvedValue(undefined),
      db: jest.fn().mockReturnValue(dbMock),
      close: jest.fn().mockResolvedValue(undefined),
    };

    MongoClientMock.mockImplementationOnce(() => clientInstance);

    const service = new MongoDbService();
    await service.recordActivity({ type: "post.created", actorId: "u1" });
    await service.createNotification({
      recipientId: "u2",
      type: "follow",
      message: "New follower",
    });

    expect(collectionMock).toHaveBeenCalledWith("activity_logs");
    expect(collectionMock).toHaveBeenCalledWith("notifications");
    expect(insertOneMock).toHaveBeenCalledTimes(2);

    await service.onModuleDestroy();
    expect(clientInstance.close).toHaveBeenCalledTimes(1);
  });
});
