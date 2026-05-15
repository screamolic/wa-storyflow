import { Router, type Response, type Request } from "express";
import { fetchInstances } from "@/src/api/services/evolution";
import type { ErrorResponse } from "@/src/api/types";

const router = Router();

router.get("/instances", async (req: Request, res: Response) => {
  try {
    const configHeader = req.headers["x-whatsapp-config"];
    const config = configHeader ? JSON.parse(configHeader as string) : undefined;

    const instances = await fetchInstances(config);
    res.json(instances);
  } catch (error: unknown) {
    const err = error as { 
      message?: string;
      response?: { data?: unknown; status?: number };
    };
    
    console.error("[Instances] Fetch Error:", err.response?.data || err.message);

    if (err.message?.includes("configuration is missing")) {
      const response: ErrorResponse = { error: "WhatsApp API configuration is missing." };
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
