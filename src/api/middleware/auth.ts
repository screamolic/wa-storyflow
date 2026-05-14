import type { Response, NextFunction } from "express";
import type { AuthRequest, AuthMiddleware } from "@/src/api/types";

export function createAuthMiddleware(): AuthMiddleware {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const appPassword = process.env.APP_PASSWORD;

    // If no password is set in env, allow all (for initial setup)
    if (!appPassword) return next();

    const providedPassword = req.headers["x-app-password"] as string | undefined;

    if (providedPassword === appPassword) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized: Invalid App Password" });
    }
  };
}
