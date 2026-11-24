import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import sessionModel from "models/session";

export interface AuthenticatedRequest extends Request {
  auth?: {
    session: {
      id: string;
      token: string;
      user_id: string;
      expires_at: string;
      created_at: string;
      updated_at: string;
    };
    user: {
      id: string;
      username: string;
      email: string;
      active: boolean;
      role: string;
      features: string[];
    };
  };
}

// Extracts session_id from cookies, validates it against active sessions, and attaches auth context.
function extractCookieToken(
  cookieHeader: string | undefined,
  cookieName: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const entries = cookieHeader.split(";").map((part) => part.trim());
  for (const entry of entries) {
    const [name, ...rest] = entry.split("=");
    if (name === cookieName) {
      return rest.join("=") || null;
    }
  }

  return null;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractCookieToken(
      request.headers?.cookie,
      sessionModel.COOKIE_NAME,
    );

    const activeSession = await sessionModel.findValidSessionWithUser(token);
    if (!activeSession || !activeSession.user.active) {
      throw new UnauthorizedException({
        name: "UnauthorizedError",
        message: "Valid authentication session is required.",
        action: "Sign in to obtain a valid session cookie.",
        status_code: 401,
      });
    }

    request.auth = activeSession;
    return true;
  }
}
