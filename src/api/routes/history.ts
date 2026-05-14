import { Router, type Response } from "express";
import { getEntries, deleteEntry } from "@/src/api/services/activity-log";
import type { SuccessResponse } from "@/src/api/types";

const router = Router();

router.get("/history", (_req, res) => {
  const entries = getEntries();
  res.json(entries);
});

router.delete("/history/:id", (req, res: Response<SuccessResponse>) => {
  const { id } = req.params;
  deleteEntry(id);
  res.json({ success: true });
});

export default router;
