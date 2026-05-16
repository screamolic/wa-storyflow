import express from "express";
import helmet from "helmet";
import { createAuthMiddleware } from "../src/api/middleware/auth";
import healthRoutes from "../src/api/routes/health";
import instancesRoutes from "../src/api/routes/instances";
import postStoryRoutes from "../src/api/routes/post-story";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const authMiddleware = createAuthMiddleware();

app.use("/api", (req, res, next) => {
  if (req.path === "/ping" || req.path === "/health-check") return next();
  authMiddleware(req, res, next);
});

app.use("/api", healthRoutes);
app.use("/api", instancesRoutes);
app.use("/api", postStoryRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[VERCEL SERVER ERROR]", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

export default app;
