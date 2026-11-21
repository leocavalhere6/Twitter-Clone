import { applyRateLimit } from "infra/rate-limiter";
import { TooManyRequestsError } from "infra/errors";
import { redis } from "infra/redis";
import { NextApiRequest } from "next";

describe("infra/rate-limiter.ts", () => {
  afterEach(async () => {
    await redis.flushdb();
  });

  test("deve permitir requisições dentro do limite", async () => {
    const req = {
      headers: {},
      socket: { remoteAddress: "192.168.0.1" },
    } as unknown as NextApiRequest;

    await expect(
      applyRateLimit(req, { maxRequests: 3 }),
    ).resolves.not.toThrow();
  });

  test("deve usar opções padrão e fallback 127.0.0.1 quando não houver IP no header ou socket", async () => {
    const req = {
      headers: {},
      socket: {},
    } as unknown as NextApiRequest;

    await expect(applyRateLimit(req)).resolves.not.toThrow();

    const keys = await redis.keys("rl:127.0.0.1");
    expect(keys).toContain("rl:127.0.0.1");
  });

  test("deve lançar TooManyRequestsError ao exceder o limite", async () => {
    const req = {
      headers: { "x-forwarded-for": "10.0.0.1, 10.0.0.2" },
      socket: {},
    } as unknown as NextApiRequest;

    const options = { maxRequests: 2, windowInSeconds: 10 };

    await applyRateLimit(req, options);
    await applyRateLimit(req, options);

    await expect(applyRateLimit(req, options)).rejects.toThrow(
      TooManyRequestsError,
    );
  });
});
