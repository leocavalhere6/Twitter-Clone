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

import { NotFoundError, ValidationError } from "infra/errors.js";
import type { User } from "models/schema";
import { MailService } from "src/infra/mail/mail.service";
import { UsersRepository } from "src/modules/users/users.repository";
import { UsersService } from "src/modules/users/users.service";

describe("src/modules/users/users.service.ts", () => {
  let service: UsersService;
  let repositoryMock: jest.Mocked<UsersRepository>;
  let mailServiceMock: jest.Mocked<
    Pick<MailService, "sendActivationEmail" | "sendWelcomeEmail">
  >;

  beforeEach(() => {
    repositoryMock = {
      findByUsernameCaseInsensitive: jest.fn(),
      findByActivationToken: jest.fn(),
      existsByEmailCaseInsensitive: jest.fn(),
      existsByUsernameCaseInsensitive: jest.fn(),
      create: jest.fn(),
      activateUser: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    mailServiceMock = {
      sendActivationEmail: jest.fn().mockResolvedValue(undefined),
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    };

    service = new UsersService(
      repositoryMock,
      mailServiceMock as unknown as MailService,
    );
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

  test("create hashes password with argon2id, sets active false, and sends activation email", async () => {
    const input = {
      username: "fresh_user",
      email: "fresh@example.com",
      password: "strongPassword123",
    };

    repositoryMock.existsByEmailCaseInsensitive.mockResolvedValue(false);
    repositoryMock.existsByUsernameCaseInsensitive.mockResolvedValue(false);
    repositoryMock.create.mockImplementation(
      async (persistenceInput) =>
        ({
          id: "550e8400-e29b-41d4-a716-446655440000",
          username: persistenceInput.username,
          email: persistenceInput.email,
          password: persistenceInput.password,
          active: persistenceInput.active ?? false,
          activation_token: persistenceInput.activationToken ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }) as unknown as User,
    );

    const result = await service.create(input);

    expect(result.password).not.toBe(input.password);
    expect(result.password).toMatch(/^\$argon2id\$/);
    expect(result.active).toBe(false);
    expect(typeof result.activation_token).toBe("string");
    expect(result.activation_token?.length).toBeGreaterThan(0);

    expect(repositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: input.username,
        email: input.email,
        active: false,
        activationToken: result.activation_token,
      }),
    );
    expect(mailServiceMock.sendActivationEmail).toHaveBeenCalledWith(
      input.email,
      expect.objectContaining({
        username: input.username,
        activationUrl: expect.stringContaining(
          `token=${result.activation_token}`,
        ),
      }),
    );
  });
});
