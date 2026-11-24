import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRED_FEATURES_KEY } from "src/common/decorators/require-features.decorator";
import type { AuthenticatedRequest } from "./session-auth.guard";

// Validates that the authenticated user possesses all required RBAC features (or admin role).
@Injectable()
export class FeaturesGuard implements CanActivate {
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeatures =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_FEATURES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredFeatures.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.auth?.user;

    if (!user) {
      throw new UnauthorizedException({
        name: "UnauthorizedError",
        message: "Authentication context is missing.",
        action: "Authenticate before accessing protected resources.",
        status_code: 401,
      });
    }

    if (user.role === "admin") {
      return true;
    }

    const grantedFeatures = new Set(user.features ?? []);
    const hasAllFeatures = requiredFeatures.every((feature) =>
      grantedFeatures.has(feature),
    );

    if (!hasAllFeatures) {
      throw new ForbiddenException({
        name: "ForbiddenError",
        message: "You do not have sufficient permissions for this action.",
        action: `Required features: ${requiredFeatures.join(", ")}.`,
        status_code: 403,
      });
    }

    return true;
  }
}
