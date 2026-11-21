import { Inject, Injectable } from "@nestjs/common";
import { NotFoundError, ValidationError } from "infra/errors.js";
import { User } from "models/schema";
import { type CreateUserDto } from "./dto/create-user.dto";
import { UsersRepository } from "./users.repository";

@Injectable()
export class UsersService {
  constructor(
    @Inject(UsersRepository)
    private readonly usersRepository: UsersRepository,
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

    return this.usersRepository.create(input);
  }
}
