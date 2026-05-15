import type { Response, NextFunction } from "express";
import type { AuthRequest, AuthMiddleware } from "@/src/api/types";

export function createAuthMiddleware(): AuthMiddleware {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    next();
  };
}
