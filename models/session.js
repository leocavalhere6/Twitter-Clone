import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "infra/drizzle.ts";
import { sessions, users } from "models/schema.ts";
import { NotFoundError, ValidationError } from "infra/errors.js";

const SESSION_COOKIE_NAME = "session_id";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Builds a Set-Cookie header string for session creation or expiration.
function buildSessionCookie(token, { expire = false } = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  const maxAge = expire ? 0 : SESSION_MAX_AGE_SECONDS;
  const value = expire ? "" : token;

  const attributes = [
    `${SESSION_COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Lax",
  ];

  if (isProduction) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}

// Authenticates credentials via Argon2id and creates a persisted session.
async function create({ email, password }) {
  const normalizedEmail = typeof email === "string" ? email.trim() : "";
  const plainPassword = typeof password === "string" ? password : "";

  if (!normalizedEmail || !plainPassword) {
    throw new ValidationError({
      message: "Email and password are required to authenticate.",
      action: "Provide a valid email and password.",
    });
  }

  const [userFound] = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = LOWER(${normalizedEmail})`)
    .limit(1);

  const passwordValid = userFound
    ? await argon2.verify(userFound.password, plainPassword).catch(() => false)
    : false;

  // Use the same error response for missing users and invalid passwords to avoid account enumeration.
  if (!userFound || !passwordValid) {
    throw new ValidationError({
      message: "Authentication credentials do not match.",
      action: "Verify that your email and password are correct.",
    });
  }

  if (!userFound.active) {
    throw new ValidationError({
      message: "This account has not been activated yet.",
      action:
        "Activate your account via the confirmation link before signing in.",
    });
  }

  const token = randomBytes(48).toString("hex");
  const expiresAt = new Date(
    Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  ).toISOString();

  const [createdSession] = await db
    .insert(sessions)
    .values({
      token,
      user_id: userFound.id,
      expires_at: expiresAt,
    })
    .returning();

  return {
    ...createdSession,
    user: {
      id: userFound.id,
      username: userFound.username,
      email: userFound.email,
      active: userFound.active,
      role: userFound.role,
      features: userFound.features,
    },
  };
}

// Finds a non-expired session by token and returns its associated user.
async function findValidSessionWithUser(token) {
  if (!token) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const [row] = await db
    .select({
      session: sessions,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
        active: users.active,
        role: users.role,
        features: users.features,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.user_id, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expires_at, nowIso)))
    .limit(1);

  return row ?? null;
}

// Deletes an existing session record to log out the user.
async function expireByToken(token) {
  if (!token) {
    throw new NotFoundError({
      message: "Session was not found.",
      action: "Ensure you are signed in before logging out.",
    });
  }

  const [deletedSession] = await db
    .delete(sessions)
    .where(eq(sessions.token, token))
    .returning();

  if (!deletedSession) {
    throw new NotFoundError({
      message: "Session was not found or has already expired.",
      action: "Sign in again if needed.",
    });
  }

  return deletedSession;
}

const session = {
  COOKIE_NAME: SESSION_COOKIE_NAME,
  MAX_AGE_SECONDS: SESSION_MAX_AGE_SECONDS,
  buildSessionCookie,
  create,
  findValidSessionWithUser,
  expireByToken,
};

export default session;
