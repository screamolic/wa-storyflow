import { Router, type Response } from "express";
import { fetchInstances } from "@/src/api/services/evolution";
import type { ErrorResponse } from "@/src/api/types";

const router = Router();

router.get("/instances", async (_req, res: Response) => {
  try {
    const instances = await fetchInstances();
    res.json(instances);
  } catch (error: unknown) {
    const err = error as { 
      message?: string;
      response?: { data?: unknown; status?: number };
    };
    
    console.error("[Instances] Fetch Error:", err.response?.data || err.message);

    if (err.message?.includes("configuration is missing")) {
      const response: ErrorResponse = { error: "Evolution API configuration is missing." };
      res.status(500).json(response);
    } else {
      res.status(err.response?.status || 500).json({ 
        error: err.message || "Failed to fetch instances",
        details: err.response?.data
      });
    }
  }
});

export default router;
