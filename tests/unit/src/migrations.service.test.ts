jest.mock("@nestjs/common", () => ({
  Injectable: () => () => {},
  Inject: () => () => {},
}));

const migrationRunnerMock = jest.fn();
jest.mock("node-pg-migrate", () => ({
  __esModule: true,
  default: (...args: unknown[]) => migrationRunnerMock(...args),
}));

import { DatabaseService } from "src/infra/database/database.service";
import { MigrationsService } from "src/modules/migrations/migrations.service";

describe("src/modules/migrations/migrations.service.ts", () => {
  let endClientMock: jest.Mock;
  let service: MigrationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    endClientMock = jest.fn().mockResolvedValue(undefined);
    const getNewClientMock = jest.fn().mockResolvedValue({
      end: endClientMock,
    });

    const dbMock = {
      getNewClient: getNewClientMock,
    } as unknown as DatabaseService;

    service = new MigrationsService(dbMock);
  });

  test("listPendingMigrations runs with dryRun true and closes client", async () => {
    migrationRunnerMock.mockResolvedValueOnce([{ name: "001_init" }]);

    const pending = await service.listPendingMigrations();

    expect(pending).toEqual([{ name: "001_init" }]);
    expect(migrationRunnerMock).toHaveBeenCalledWith(
      expect.objectContaining({ dryRun: true }),
    );
    expect(endClientMock).toHaveBeenCalledTimes(1);
  });

  test("runPendingMigrations runs with dryRun false and closes client even on error", async () => {
    migrationRunnerMock.mockRejectedValueOnce(new Error("migration failed"));

    await expect(service.runPendingMigrations()).rejects.toThrow(
      "migration failed",
    );
    expect(migrationRunnerMock).toHaveBeenCalledWith(
      expect.objectContaining({ dryRun: false }),
    );
    expect(endClientMock).toHaveBeenCalledTimes(1);
  });
});
