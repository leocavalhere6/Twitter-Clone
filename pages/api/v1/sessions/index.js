import { createRouter } from "next-connect";
import controller from "infra/controller";
import { applyRateLimit } from "infra/rate-limiter";
import session from "models/session";

const router = createRouter();

router.post(postHandler);
router.delete(deleteHandler);

export default router.handler(controller.errorHandler);

function parseCookieToken(cookieHeader, cookieName) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((part) => part.trim());
  for (const part of cookies) {
    const [name, ...rest] = part.split("=");
    if (name === cookieName) {
      return rest.join("=") || null;
    }
  }
  return null;
}

async function postHandler(request, response) {
  await applyRateLimit(request, {
    windowInSeconds: 60,
    maxRequests: 10,
    keyPrefix: "rate-limit:sessions:post",
  });

  const { email, password } = request.body ?? {};
  const createdSession = await session.create({ email, password });

  response.setHeader(
    "Set-Cookie",
    session.buildSessionCookie(createdSession.token),
  );

  return response.status(201).json(createdSession);
}

async function deleteHandler(request, response) {
  const token =
    parseCookieToken(request.headers.cookie, session.COOKIE_NAME) ||
    request.body?.token;

  await session.expireByToken(token);

  response.setHeader(
    "Set-Cookie",
    session.buildSessionCookie("", { expire: true }),
  );

  return response.status(200).json({ logged_out: true });
}
