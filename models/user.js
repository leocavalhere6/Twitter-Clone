import { sql } from "drizzle-orm";
import { db } from "infra/drizzle.ts";
import { users } from "models/schema.ts";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneByUsername(username) {
  const [userFound] = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.username}) = LOWER(${username})`)
    .limit(1);

  if (!userFound) {
    throw new NotFoundError({
      message: "O username informado não foi encontrado no sistema.",
      action: "Verifique se o username está digitado corretamente.",
    });
  }

  return userFound;
}

async function create(userInputValues) {
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueUsername(userInputValues.username);

  const [newUser] = await db
    .insert(users)
    .values({
      username: userInputValues.username,
      email: userInputValues.email,
      password: userInputValues.password,
    })
    .returning();

  return newUser;

  async function validateUniqueEmail(email) {
    const [existingEmail] = await db
      .select({ email: users.email })
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`)
      .limit(1);

    if (existingEmail) {
      throw new ValidationError({
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar o cadastro.",
      });
    }
  }

  async function validateUniqueUsername(username) {
    const [existingUser] = await db
      .select({ username: users.username })
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`)
      .limit(1);

    if (existingUser) {
      throw new ValidationError({
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar o cadastro.",
      });
    }
  }
}

const user = {
  create,
  findOneByUsername,
};

export default user;
