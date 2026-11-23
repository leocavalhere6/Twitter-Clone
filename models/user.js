import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { eq, sql } from "drizzle-orm";
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

  const passwordHash = await argon2.hash(userInputValues.password);
  const activationToken = randomBytes(32).toString("hex");

  const [newUser] = await db
    .insert(users)
    .values({
      username: userInputValues.username,
      email: userInputValues.email,
      password: passwordHash,
      active: false,
      activation_token: activationToken,
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

async function activateByToken(token) {
  if (!token) {
    throw new ValidationError({
      message: "O token de ativação é obrigatório.",
      action: "Informe um token de ativação válido.",
    });
  }

  const [userFound] = await db
    .select()
    .from(users)
    .where(eq(users.activation_token, token))
    .limit(1);

  if (!userFound) {
    throw new NotFoundError({
      message:
        "O token de ativação informado não foi encontrado ou é inválido.",
      action: "Solicite um novo link de ativação de conta.",
    });
  }

  const [activatedUser] = await db
    .update(users)
    .set({
      active: true,
      activation_token: null,
      updated_at: new Date().toISOString(),
    })
    .where(eq(users.id, userFound.id))
    .returning();

  return activatedUser;
}

const user = {
  create,
  findOneByUsername,
  activateByToken,
};

export default user;
