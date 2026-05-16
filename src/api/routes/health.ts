import { Router } from "express";
import { getConnectionStatus } from "../services/connection-cache";
import type { PingResponse, HealthCheckResponse } from "../types";

const router = Router();

router.get("/ping", (_req, res) => {
  const response: PingResponse = {
    status: "pong",
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

router.get("/health-check", async (_req, res) => {
  const status = await getConnectionStatus();

  if (status === "connected") {
    const response: HealthCheckResponse = { status: "connected" };
    res.json(response);
  } else {
    const response: HealthCheckResponse = {
      status: "disconnected",
      message: "Unable to reach Evolution API",
    };
    res.status(500).json(response);
  }
});

export default router;
