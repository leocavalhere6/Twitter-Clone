import { Client, Pool } from "pg";
import { ServiceError } from "infra/errors.js";
import { DatabaseService } from "src/infra/database/database.service";

jest.mock("pg", () => {
  const poolEndMock = jest.fn().mockResolvedValue(undefined);
  const clientConnectMock = jest.fn().mockResolvedValue(undefined);
  const clientQueryMock = jest.fn();
  const clientEndMock = jest.fn().mockResolvedValue(undefined);

  return {
    Pool: jest.fn().mockImplementation(() => ({
      end: poolEndMock,
    })),
    Client: jest.fn().mockImplementation(() => ({
      connect: clientConnectMock,
      query: clientQueryMock,
      end: clientEndMock,
    })),
    __mocks__: {
      poolEndMock,
      clientConnectMock,
      clientQueryMock,
      clientEndMock,
    },
  };
});

jest.mock("drizzle-orm/node-postgres", () => ({
  drizzle: jest.fn().mockReturnValue({}),
}));

describe("DatabaseService", () => {
  const pgMocks = (
    jest.requireMock("pg") as {
      __mocks__: {
        poolEndMock: jest.Mock;
        clientConnectMock: jest.Mock;
        clientQueryMock: jest.Mock;
        clientEndMock: jest.Mock;
      };
    }
  ).__mocks__;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("query executes SQL and closes client", async () => {
    pgMocks.clientQueryMock.mockResolvedValueOnce({ rows: [{ ok: 1 }] });

    const service = new DatabaseService();
    const res = await service.query("SELECT 1 AS ok");

    expect(res.rows).toEqual([{ ok: 1 }]);
    expect(pgMocks.clientConnectMock).toHaveBeenCalledTimes(1);
    expect(pgMocks.clientEndMock).toHaveBeenCalledTimes(1);
  });

  test("query wraps errors in ServiceError and onModuleDestroy ends pool", async () => {
    pgMocks.clientQueryMock.mockRejectedValueOnce(new Error("Query failed"));

    const service = new DatabaseService();
    await expect(service.query("SELECT * FROM invalid")).rejects.toThrow(
      ServiceError,
    );
    expect(pgMocks.clientEndMock).toHaveBeenCalledTimes(1);

    await service.onModuleDestroy();
    expect(pgMocks.poolEndMock).toHaveBeenCalledTimes(1);
    expect(Pool).toHaveBeenCalled();
    expect(Client).toHaveBeenCalled();
  });
});
