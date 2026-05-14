import { GoogleGenAI } from "@google/genai";
import { PERSONAS_GROUPED, STRUCTURES_GROUPED } from "@/src/constants";

const AI_MODEL_NAME = "gemini-3-flash-preview";

const AI_STYLING_INSTRUCTION =
  "Apply WhatsApp text formatting: use *bold* for key terms, _italics_ for emphasis, ~strikethrough~ for corrections, and ```code``` for technical terms.";

const AI_AESTHETIC_INSTRUCTION =
  "Make the content 'aesthetic': use elegant spacing, relevant emojis as decorative elements, and a poetic or stylish tone.";

let _ai: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

function findDescription(groupObj: Record<string, Record<string, string>>, key: string): string {
  for (const cat of Object.values(groupObj)) {
    if (cat[key]) return cat[key];
  }
  return key; // fallback to the key itself
}

export async function generateStoryContent(params: {
  prompt: string;
  persona?: string;
  structure?: string;
  format: "text" | "image";
  autoStyling?: boolean;
  aestheticMode?: boolean;
}): Promise<string> {
  const personaDesc = findDescription(PERSONAS_GROUPED, params.persona || "Bestie Santai");
  const structureDesc = findDescription(STRUCTURES_GROUPED, params.structure || "Storytelling (Hook-Story-Offer)");
  const styling = params.autoStyling ? AI_STYLING_INSTRUCTION : "";
  const aesthetic = params.aestheticMode ? AI_AESTHETIC_INSTRUCTION : "";

  const systemPrompt = `You are a WhatsApp Story content creator.
Persona (${params.persona}): '${personaDesc}'
Structure (${params.structure}): '${structureDesc}'
Format: ${params.format === "text" ? "Text-only story" : "Caption for an image story"}

${styling}
${aesthetic}

Generate a compelling WhatsApp Story content in Indonesian language.
If the persona or structure is 'Kritis', 'Analitis', 'Investigatif', or 'Politik', ensure the tone is sharp, uses rhetorical questions, mentions potential intrigues/speculations, and mimics well-researched critical analysis.

If format is text, aim for 1 to 3 story parts (total ~500-800 characters) unless the topic requires more depth. Use clear paragraphs or numbered points.
If format is image, generate a punchy caption under 200 characters.

Return ONLY the text content, no other explanations.

User Prompt: ${params.prompt}
(IMPORTANT: Respect the selected Persona and Structure strictly. If critical, don't hold back on sharp analysis or data-backed speculation.)`;

  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: AI_MODEL_NAME,
    contents: systemPrompt,
  });

  return response.text || "";
}

export async function generateAIImage(prompt: string): Promise<string> {
  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ parts: [{ text: `Create a professional and aesthetic image for a WhatsApp Story based on this topic: ${prompt}. The image should be visually appealing, modern, and high quality.` }] }],
    config: {
      imageConfig: {
        aspectRatio: "9:16",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Gagal menghasilkan gambar AI. Silakan coba lagi.");
}

export async function enhanceStoryContent(params: {
  content: string;
  autoStyling?: boolean;
  aestheticMode?: boolean;
}): Promise<string> {
  const styling = params.autoStyling ? AI_STYLING_INSTRUCTION : "";
  const aesthetic = params.aestheticMode ? AI_AESTHETIC_INSTRUCTION : "";

  const systemPrompt = `You are a WhatsApp Story content expert.
Your task is to REWRITE the user's manual content to make it better while keeping the original meaning.

${styling}
${aesthetic}

Return ONLY the improved text content in Indonesian language, no other explanations.

User Content: ${params.content}`;

  const ai = getGenAI();
  const response = await ai.models.generateContent({
    model: AI_MODEL_NAME,
    contents: systemPrompt,
  });

  return response.text || "";
}
