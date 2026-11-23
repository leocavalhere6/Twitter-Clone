jest.mock("@nestjs/common", () => ({
  Injectable: () => () => {},
  Controller: () => () => {},
  Get: () => () => {},
  Post: () => () => {},
  HttpCode: () => () => {},
  UsePipes: () => () => {},
  Param: () => () => {},
  Body: () => () => {},
  Inject: () => () => {},
  Optional: () => () => {},
  HttpStatus: {
    CREATED: 201,
  },
}));

jest.mock("src/common/pipes/zod-validation.pipe", () => ({
  ZodValidationPipe: jest.fn(),
}));

import { MigrationsController } from "src/modules/migrations/migrations.controller";
import { MigrationsService } from "src/modules/migrations/migrations.service";
import { StatusController } from "src/modules/status/status.controller";
import { StatusService } from "src/modules/status/status.service";
import { UsersController } from "src/modules/users/users.controller";
import { UsersService } from "src/modules/users/users.service";

describe("NestJS controllers delegation", () => {
  test("StatusController delegates getStatus to StatusService", async () => {
    const expected = {
      updated_at: "2026-11-21T00:00:00.000Z",
      dependencies: {
        database: {
          version: "16.4",
          max_connections: 100,
          opened_connections: 1,
        },
      },
    };
    const serviceMock = {
      getStatus: jest.fn().mockResolvedValue(expected),
    } as unknown as StatusService;

    const controller = new StatusController(serviceMock);
    const result = await controller.getStatus();

    expect(result).toEqual(expected);
    expect(serviceMock.getStatus).toHaveBeenCalledTimes(1);
  });

  test("MigrationsController delegates GET and POST to MigrationsService", async () => {
    const serviceMock = {
      listPendingMigrations: jest.fn().mockResolvedValue([]),
      runPendingMigrations: jest.fn().mockResolvedValue([{ name: "001" }]),
    } as unknown as MigrationsService;

    const controller = new MigrationsController(serviceMock);

    await expect(controller.listPending()).resolves.toEqual([]);
    await expect(controller.runPending()).resolves.toEqual([{ name: "001" }]);
    expect(serviceMock.listPendingMigrations).toHaveBeenCalledTimes(1);
    expect(serviceMock.runPendingMigrations).toHaveBeenCalledTimes(1);
  });

  test("UsersController delegates create and findOne to UsersService", async () => {
    const createdUser = {
      id: "1",
      username: "leo_dev",
      email: "leo@example.com",
      password: "hashed-password",
      active: false,
      activation_token: "token-123",
      created_at: new Date(),
      updated_at: new Date(),
    };
    const serviceMock = {
      create: jest.fn().mockResolvedValue(createdUser),
      findOneByUsername: jest.fn().mockResolvedValue(createdUser),
    } as unknown as UsersService;

    const controller = new UsersController(serviceMock);
    const input = {
      username: "leo_dev",
      email: "leo@example.com",
      password: "Password123",
    };

    await expect(controller.create(input)).resolves.toEqual(createdUser);
    await expect(controller.findOne("leo_dev")).resolves.toEqual(createdUser);
    expect(serviceMock.create).toHaveBeenCalledWith(input);
    expect(serviceMock.findOneByUsername).toHaveBeenCalledWith("leo_dev");
  });
});
