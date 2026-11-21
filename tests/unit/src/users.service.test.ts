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
  HttpStatus: {
    CREATED: 201,
  },
}));

import { NotFoundError, ValidationError } from "infra/errors.js";
import type { User } from "models/schema";
import { UsersRepository } from "src/modules/users/users.repository";
import { UsersService } from "src/modules/users/users.service";

describe("src/modules/users/users.service.ts", () => {
  let service: UsersService;
  let repositoryMock: jest.Mocked<UsersRepository>;

  beforeEach(() => {
    repositoryMock = {
      findByUsernameCaseInsensitive: jest.fn(),
      existsByEmailCaseInsensitive: jest.fn(),
      existsByUsernameCaseInsensitive: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    service = new UsersService(repositoryMock);
  });

  test("findOneByUsername throws NotFoundError when user does not exist", async () => {
    repositoryMock.findByUsernameCaseInsensitive.mockResolvedValue(undefined);

    await expect(service.findOneByUsername("missing_user")).rejects.toThrow(
      NotFoundError,
    );
  });

  test("create throws ValidationError when email is already in use", async () => {
    repositoryMock.existsByEmailCaseInsensitive.mockResolvedValue(true);

    await expect(
      service.create({
        username: "valid_user",
        email: "taken@example.com",
        password: "strongPassword123",
      }),
    ).rejects.toThrow(ValidationError);
  });

  test("create throws ValidationError when username is already in use", async () => {
    repositoryMock.existsByEmailCaseInsensitive.mockResolvedValue(false);
    repositoryMock.existsByUsernameCaseInsensitive.mockResolvedValue(true);

    await expect(
      service.create({
        username: "taken_user",
        email: "new@example.com",
        password: "strongPassword123",
      }),
    ).rejects.toThrow(ValidationError);
  });

  test("create persists and returns new user when email and username are available", async () => {
    const input = {
      username: "fresh_user",
      email: "fresh@example.com",
      password: "strongPassword123",
    };
    const createdUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      ...input,
      created_at: new Date(),
      updated_at: new Date(),
    } as unknown as User;

    repositoryMock.existsByEmailCaseInsensitive.mockResolvedValue(false);
    repositoryMock.existsByUsernameCaseInsensitive.mockResolvedValue(false);
    repositoryMock.create.mockResolvedValue(createdUser);

    const result = await service.create(input);

    expect(result).toEqual(createdUser);
    expect(repositoryMock.create).toHaveBeenCalledWith(input);
  });
});
