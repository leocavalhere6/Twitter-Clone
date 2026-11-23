import { Inject, Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import { randomBytes } from "node:crypto";
import { NotFoundError, ValidationError } from "infra/errors.js";
import { User } from "models/schema";
import { MailService } from "src/infra/mail/mail.service";
import { type CreateUserDto } from "./dto/create-user.dto";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(
    @Inject(UsersRepository)
    private readonly usersRepository: UsersRepository,
    @Inject(MailService)
    private readonly mailService: MailService,
  ) {}

  async findOneByUsername(username: string): Promise<User> {
    const userFound =
      await this.usersRepository.findByUsernameCaseInsensitive(username);

    if (!userFound) {
      throw new NotFoundError({
        cause: undefined,
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return userFound;
  }

  async create(input: CreateUserDto): Promise<User> {
    const emailTaken = await this.usersRepository.existsByEmailCaseInsensitive(
      input.email,
    );
    if (emailTaken) {
      throw new ValidationError({
        cause: undefined,
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar o cadastro.",
      });
    }

    const usernameTaken =
      await this.usersRepository.existsByUsernameCaseInsensitive(
        input.username,
      );
    if (usernameTaken) {
      throw new ValidationError({
        cause: undefined,
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar o cadastro.",
      });
    }

    const passwordHash = await argon2.hash(input.password);
    const activationToken = randomBytes(32).toString("hex");

    const createdUser = await this.usersRepository.create({
      username: input.username,
      email: input.email,
      password: passwordHash,
      active: false,
      activationToken,
    });

    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const activationUrl = `${baseUrl}/activate?token=${activationToken}`;

    await this.mailService.sendActivationEmail(createdUser.email, {
      username: createdUser.username,
      activationUrl,
    });

    return createdUser;
  }

  async activateByToken(token: string): Promise<User> {
    if (!token) {
      throw new ValidationError({
        cause: undefined,
        message: "O token de ativação é obrigatório.",
        action: "Informe um token de ativação válido.",
      });
    }

    const userFound = await this.usersRepository.findByActivationToken(token);
    if (!userFound) {
      throw new NotFoundError({
        cause: undefined,
        message:
          "O token de ativação informado não foi encontrado ou é inválido.",
        action: "Solicite um novo link de ativação de conta.",
      });
    }

    const activatedUser = await this.usersRepository.activateUser(userFound.id);

    await this.mailService.sendWelcomeEmail(activatedUser.email, {
      username: activatedUser.username,
    });

    return activatedUser;
  }
}
