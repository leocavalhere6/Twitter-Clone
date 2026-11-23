import { createRouter } from "next-connect";
import controller from "infra/controller";
import { applyRateLimit } from "infra/rate-limiter";
import user from "models/user";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandler);

async function postHandler(request, response) {
  await applyRateLimit(request, {
    windowInSeconds: 60,
    maxRequests: 10,
    keyPrefix: "rate-limit:users:activate:post",
  });

  const token = request.body?.token || request.query?.token;
  const activatedUser = await user.activateByToken(token);

  return response.status(200).json(activatedUser);
}
