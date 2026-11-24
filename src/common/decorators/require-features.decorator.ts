import { SetMetadata } from "@nestjs/common";

export const REQUIRED_FEATURES_KEY = "required_features";

// Declares required RBAC feature scopes on a controller class or route handler.
export const RequireFeatures = (...features: string[]) =>
  SetMetadata(REQUIRED_FEATURES_KEY, features);
