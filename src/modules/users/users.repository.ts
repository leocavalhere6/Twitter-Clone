import { Inject, Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DatabaseService } from "src/infra/database/database.service";
import { users, User } from "models/schema";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async findByUsernameCaseInsensitive(
    username: string,
  ): Promise<User | undefined> {
    const [userFound] = await this.databaseService.db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`)
      .limit(1);

    return userFound;
  }

  async existsByEmailCaseInsensitive(email: string): Promise<boolean> {
    const [existingEmail] = await this.databaseService.db
      .select({ email: users.email })
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`)
      .limit(1);

    return Boolean(existingEmail);
  }

  async existsByUsernameCaseInsensitive(username: string): Promise<boolean> {
    const [existingUser] = await this.databaseService.db
      .select({ username: users.username })
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`)
      .limit(1);

    return Boolean(existingUser);
  }

  async create(input: CreateUserDto): Promise<User> {
    const [newUser] = await this.databaseService.db
      .insert(users)
      .values({
        username: input.username,
        email: input.email,
        password: input.password,
      })
      .returning();

    return newUser;
  }
}
