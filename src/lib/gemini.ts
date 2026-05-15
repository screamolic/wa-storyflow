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

async function callLLM(systemMessage: string, userMessage: string | null, aiConfig?: any): Promise<string> {
  const provider = aiConfig?.aiProvider || 'gemini';
  
  if (provider === 'openai') {
    if (!aiConfig?.aiApiKey) throw new Error("API Key untuk OpenAI belum dikonfigurasi.");
    const model = aiConfig?.aiModel || "gpt-4o";
    const endpoint = aiConfig?.aiEndpoint || "https://api.openai.com/v1/chat/completions";
    
    // Ensure we append chat/completions if missing and looks like root endpoint
    const url = endpoint.endsWith('/chat/completions') ? endpoint : `${endpoint.replace(/\/$/, '')}/chat/completions`;
    
    const messages = [];
    if (systemMessage) messages.push({ role: "system", content: systemMessage });
    if (userMessage) messages.push({ role: "user", content: userMessage });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${aiConfig.aiApiKey}`
      },
      body: JSON.stringify({
        model,
        messages
      })
    });
    if (!res.ok) throw new Error(`OpenAI API Error: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } 
  
  if (provider === 'claude') {
    if (!aiConfig?.aiApiKey) throw new Error("API Key untuk Claude belum dikonfigurasi.");
    const model = aiConfig?.aiModel || "claude-3-5-sonnet-20240620";
    const endpoint = aiConfig?.aiEndpoint || "https://api.anthropic.com/v1/messages";
    const url = endpoint.endsWith('/messages') ? endpoint : `${endpoint.replace(/\/$/, '')}/messages`;

    // Because anthropic doesn't allow calling from browser directly due to CORS by default, this might fail unless proxy is used.
    // It's the user's responsibility to supply a valid CORS-enabled endpoint in settings if needed.
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": aiConfig.aiApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemMessage,
        messages: userMessage ? [{ role: "user", content: userMessage }] : []
      })
    });
    if (!res.ok) throw new Error(`Claude API Error: ${await res.text()}`);
    const data = await res.json();
    return data.content?.[0]?.text || "";
  }

  // Default to Gemini
  let genAiApiKey = process.env.GEMINI_API_KEY;
  if (aiConfig?.aiProvider === "gemini" && aiConfig?.aiApiKey) {
    genAiApiKey = aiConfig.aiApiKey;
  }
  const ai = genAiApiKey ? new GoogleGenAI({ apiKey: genAiApiKey }) : getGenAI();
  const model = aiConfig?.aiModel || AI_MODEL_NAME;
  
  const contents = [systemMessage];
  if (userMessage) contents.push(userMessage);

  const response = await ai.models.generateContent({
    model,
    contents: contents.join("\n\n"),
  });
  return response.text || "";
}

export async function generateStoryContent(params: {
  prompt: string;
  persona?: string;
  structure?: string;
  format: "text" | "image";
  autoStyling?: boolean;
  aestheticMode?: boolean;
  aiConfig?: any;
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
(IMPORTANT: Respect the selected Persona and Structure strictly. If critical, don't hold back on sharp analysis or data-backed speculation.)`;

  return await callLLM(systemPrompt, `User Prompt: ${params.prompt}`, params.aiConfig);
}

export async function generateAIImage(prompt: string, aiConfig?: any): Promise<string> {
  // For images, we still fallback to Google Gemini unless openai is requested
  const provider = aiConfig?.aiProvider || 'gemini';
  
  if (provider === 'openai' && aiConfig?.aiApiKey) {
    const endpoint = aiConfig?.aiEndpoint || "https://api.openai.com/v1/images/generations";
    const url = endpoint.endsWith('/images/generations') ? endpoint : `${endpoint.replace(/\/$/, '')}/images/generations`;
    
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${aiConfig.aiApiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Create a professional and aesthetic image for a WhatsApp Story based on this topic: ${prompt}. The image should be visually appealing, modern, and high quality.`,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });
    if (!res.ok) throw new Error(`OpenAI Image API Error: ${await res.text()}`);
    const data = await res.json();
    if (data?.data?.[0]?.b64_json) {
       return `data:image/png;base64,${data.data[0].b64_json}`;
    }
  }

  // default gemini image generation
  let genAiApiKey = process.env.GEMINI_API_KEY;
  if (aiConfig?.aiProvider === "gemini" && aiConfig?.aiApiKey) {
    genAiApiKey = aiConfig.aiApiKey;
  }
  const ai = genAiApiKey ? new GoogleGenAI({ apiKey: genAiApiKey }) : getGenAI();
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
  aiConfig?: any;
}): Promise<string> {
  const styling = params.autoStyling ? AI_STYLING_INSTRUCTION : "";
  const aesthetic = params.aestheticMode ? AI_AESTHETIC_INSTRUCTION : "";

  const systemPrompt = `You are a WhatsApp Story content expert.
Your task is to REWRITE the user's manual content to make it better while keeping the original meaning.

${styling}
${aesthetic}

Return ONLY the improved text content in Indonesian language, no other explanations.`;

  return await callLLM(systemPrompt, `User Content: ${params.content}`, params.aiConfig);
}

