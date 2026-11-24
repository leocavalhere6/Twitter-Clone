import argon2 from "argon2";
import { db } from "infra/drizzle.ts";
import { NotFoundError, ValidationError } from "infra/errors.js";
import session from "models/session.js";

jest.mock("infra/drizzle.ts", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("argon2", () => ({
  verify: jest.fn(),
}));

describe("models/session.js", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test("buildSessionCookie builds cookie for creation, production, and expiration", () => {
    const devCookie = session.buildSessionCookie("tok123");
    expect(devCookie).toContain("session_id=tok123");
    expect(devCookie).toContain("HttpOnly");
    expect(devCookie).toContain("SameSite=Lax");
    expect(devCookie).not.toContain("Secure");

    const expiredCookie = session.buildSessionCookie("tok123", {
      expire: true,
    });
    expect(expiredCookie).toContain("session_id=");
    expect(expiredCookie).toContain("Max-Age=0");

    process.env.NODE_ENV = "production";
    const prodCookie = session.buildSessionCookie("tok123");
    expect(prodCookie).toContain("Secure");
  });

  test("create rejects missing credentials, invalid credentials, and inactive user", async () => {
    await expect(session.create({ email: "", password: "" })).rejects.toThrow(
      ValidationError,
    );

    const limitEmptyMock = jest.fn().mockResolvedValue([]);
    const whereEmptyMock = jest.fn().mockReturnValue({ limit: limitEmptyMock });
    const fromEmptyMock = jest.fn().mockReturnValue({ where: whereEmptyMock });
    db.select.mockReturnValueOnce({ from: fromEmptyMock });

    await expect(
      session.create({ email: "missing@example.com", password: "secret" }),
    ).rejects.toThrow(ValidationError);

    const inactiveUser = {
      id: "u1",
      username: "leo",
      email: "leo@example.com",
      password: "hashed-password",
      active: false,
      role: "user",
      features: [],
    };
    const limitInactiveMock = jest.fn().mockResolvedValue([inactiveUser]);
    const whereInactiveMock = jest
      .fn()
      .mockReturnValue({ limit: limitInactiveMock });
    const fromInactiveMock = jest
      .fn()
      .mockReturnValue({ where: whereInactiveMock });
    db.select.mockReturnValueOnce({ from: fromInactiveMock });
    argon2.verify.mockResolvedValue(true);

    await expect(
      session.create({ email: "leo@example.com", password: "secret" }),
    ).rejects.toThrow(ValidationError);
  });

  test("create inserts session for active authenticated user and expireByToken handles missing or valid tokens", async () => {
    const activeUser = {
      id: "u1",
      username: "leo",
      email: "leo@example.com",
      password: "hashed-password",
      active: true,
      role: "user",
      features: ["create:session"],
    };
    const limitMock = jest.fn().mockResolvedValue([activeUser]);
    const whereMock = jest.fn().mockReturnValue({ limit: limitMock });
    const fromMock = jest.fn().mockReturnValue({ where: whereMock });
    db.select.mockReturnValueOnce({ from: fromMock });
    argon2.verify.mockResolvedValue(true);

    const createdSession = {
      id: "s1",
      token: "generated-token",
      user_id: "u1",
      expires_at: "2026-12-24T00:00:00.000Z",
    };
    const returningMock = jest.fn().mockResolvedValue([createdSession]);
    const valuesMock = jest.fn().mockReturnValue({ returning: returningMock });
    db.insert.mockReturnValueOnce({ values: valuesMock });

    const created = await session.create({
      email: "  LEO@example.com ",
      password: "Password123!",
    });
    expect(created.user.id).toBe("u1");
    expect(created.id).toBe("s1");

    await expect(session.expireByToken("")).rejects.toThrow(NotFoundError);

    const delReturningEmpty = jest.fn().mockResolvedValue([]);
    const delWhereEmpty = jest
      .fn()
      .mockReturnValue({ returning: delReturningEmpty });
    db.delete.mockReturnValueOnce({ where: delWhereEmpty });

    await expect(session.expireByToken("unknown")).rejects.toThrow(
      NotFoundError,
    );

    const delReturningOk = jest.fn().mockResolvedValue([createdSession]);
    const delWhereOk = jest.fn().mockReturnValue({ returning: delReturningOk });
    db.delete.mockReturnValueOnce({ where: delWhereOk });

    await expect(session.expireByToken("generated-token")).resolves.toEqual(
      createdSession,
    );
  });
});
