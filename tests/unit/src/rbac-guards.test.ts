import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import sessionModel from "models/session";
import {
  REQUIRED_FEATURES_KEY,
  RequireFeatures,
} from "src/common/decorators/require-features.decorator";
import { FeaturesGuard } from "src/common/guards/features.guard";
import {
  AuthenticatedRequest,
  SessionAuthGuard,
} from "src/common/guards/session-auth.guard";

type AuthSession = NonNullable<AuthenticatedRequest["auth"]>["session"];

function createMockContext(
  request: Partial<AuthenticatedRequest>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe("RBAC decorator and guards", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("RequireFeatures stores feature metadata under REQUIRED_FEATURES_KEY", () => {
    class SampleController {
      @RequireFeatures("read:session", "create:content")
      handler() {}
    }

    const metadata = Reflect.getMetadata(
      REQUIRED_FEATURES_KEY,
      SampleController.prototype.handler,
    );
    expect(metadata).toEqual(["read:session", "create:content"]);
  });

  test("SessionAuthGuard throws UnauthorizedException when session cookie is missing or invalid", async () => {
    jest
      .spyOn(sessionModel, "findValidSessionWithUser")
      .mockResolvedValue(null);

    const guard = new SessionAuthGuard();
    const context = createMockContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  test("SessionAuthGuard attaches session and user to request when valid", async () => {
    const authPayload = {
      session: {
        id: "session-1",
        token: "valid-token",
        user_id: "user-1",
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      user: {
        id: "user-1",
        username: "leo_dev",
        email: "leo@example.com",
        active: true,
        role: "user",
        features: ["create:session", "read:session"],
      },
    };

    jest
      .spyOn(sessionModel, "findValidSessionWithUser")
      .mockResolvedValue(authPayload);

    const guard = new SessionAuthGuard();
    const req: Partial<AuthenticatedRequest> = {
      headers: { cookie: `session_id=valid-token; theme=dark` },
    };

    await expect(guard.canActivate(createMockContext(req))).resolves.toBe(true);
    expect(req.auth).toEqual(authPayload);
  });

  test("FeaturesGuard allows when no features are required or user has all required features", () => {
    const reflector = new Reflector();
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValueOnce([])
      .mockReturnValueOnce(["read:session"]);

    const guard = new FeaturesGuard(reflector);

    expect(
      guard.canActivate(
        createMockContext({
          auth: {
            session: {} as AuthSession,
            user: {
              id: "user-1",
              username: "leo_dev",
              email: "leo@example.com",
              active: true,
              role: "user",
              features: ["read:session"],
            },
          },
        }),
      ),
    ).toBe(true);

    expect(
      guard.canActivate(
        createMockContext({
          auth: {
            session: {} as AuthSession,
            user: {
              id: "user-1",
              username: "leo_dev",
              email: "leo@example.com",
              active: true,
              role: "user",
              features: ["read:session"],
            },
          },
        }),
      ),
    ).toBe(true);
  });

  test("FeaturesGuard throws ForbiddenException when user lacks required feature", () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(["ban:user"]);

    const guard = new FeaturesGuard(reflector);
    const context = createMockContext({
      auth: {
        session: {} as AuthSession,
        user: {
          id: "user-1",
          username: "leo_dev",
          email: "leo@example.com",
          active: true,
          role: "user",
          features: ["read:session"],
        },
      },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
