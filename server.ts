import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import { createAuthMiddleware } from "@/src/api/middleware/auth";
import healthRoutes from "@/src/api/routes/health";
import instancesRoutes from "@/src/api/routes/instances";
import historyRoutes from "@/src/api/routes/history";
import postStoryRoutes from "@/src/api/routes/post-story";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // --- Security Headers (must be first) ---
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "blob:", "https:"],
              connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
              fontSrc: ["'self'", "data:"],
              objectSrc: ["'none'"],
              frameSrc: ["'none'"],
              upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
            },
          }
        : false, // Disable CSP in dev (Vite needs inline scripts)
      crossOriginEmbedderPolicy: false, // Required for some Vite features
    })
  );

  // --- Body Parsing ---
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const authMiddleware = createAuthMiddleware();

  // Apply auth to all /api routes except /ping and /health-check
  app.use("/api", (req, res, next) => {
    if (req.path === "/ping" || req.path === "/health-check") return next();
    authMiddleware(req, res, next);
  });

  // Register route modules
  app.use("/api", healthRoutes);
  app.use("/api", instancesRoutes);
  app.use("/api", historyRoutes);
  app.use("/api", postStoryRoutes);

  // Vite middleware (dev) or static files (production)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // --- Global Error Handler ---
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[SERVER ERROR]", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
      details: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Running on http://0.0.0.0:${PORT}`);
    console.log(`[SERVER] NODE_ENV: ${process.env.NODE_ENV}`);
  });
}

startServer().catch((err) => {
  console.error("[SERVER] Failed to start:", err);
});
