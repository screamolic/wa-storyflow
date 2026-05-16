import { Router, type Response } from "express";
import { sendStatus } from "../services/evolution";
import { validatePostStory } from "../services/validation";
import type {
  StoryPayload,
  ErrorResponse,
} from "../types";

const router = Router();

router.post("/post-story", async (req, res) => {
  // --- Input Validation ---
  const validation = validatePostStory(req.body);
  if (!validation.success) {
    const errorMessages = validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    const response: ErrorResponse = {
      error: `Validasi gagal: ${errorMessages}`,
    };
    res.status(400).json(response);
    return;
  }

  const { type, content, caption, backgroundColor, font, instanceName, config } = validation.data;

  const defaultInstance = process.env.EVOLUTION_INSTANCE_NAME;
  const targetInstance = instanceName || defaultInstance;

  if (!targetInstance) {
    const response: ErrorResponse = {
      error: "Evolution API configuration or Instance Name is missing.",
    };
    res.status(500).json(response);
    return;
  }

  const payload: StoryPayload = {
    type,
    content,
    allContacts: true,
  };

  if (type === "text") {
    payload.backgroundColor = backgroundColor;
    payload.font = font;
  } else {
    payload.caption = caption || "";
  }

  try {
    const responseData = await sendStatus(payload, targetInstance, config);

    res.json(responseData);
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: unknown; status?: number };
      message?: string;
    };
    const errorMsg = err.response?.data || err.message;
    console.error("[PostStory] Evolution API Error:", errorMsg);

    res.status(err.response?.status || 500).json(
      err.response?.data || { error: err.message }
    );
  }
});

export default router;
