import type { Response, NextFunction } from "express";
import type { AuthRequest, AuthMiddleware } from "../types";
import admin from "firebase-admin";
import firebaseConfig from "../../../firebase-applet-config.json";

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export function createAuthMiddleware(): AuthMiddleware {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Fallback to APP_PASSWORD if needed for some external tools,
      // but otherwise reject the request for better security.
      const appPassword = process.env.APP_PASSWORD;
      const providedPassword = req.headers["x-app-password"];
      if (appPassword && providedPassword === appPassword) {
        return next();
      }
      res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
      return;
    }

    const token = authHeader.split("Bearer ")[1];

    try {
      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Store user info in request for downstream use
      req.user = decodedToken;
      
      next();
    } catch (error) {
      console.error("[Auth] Invalid token:", error);
      res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  };
}
