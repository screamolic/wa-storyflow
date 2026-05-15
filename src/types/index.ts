export type Persona = string;
export type Structure = string;

export type Format = "text" | "image";
export type Mode = "ai" | "manual";
export type ImageSource = "url" | "upload" | "ai";
export type ConnectionStatus = "checking" | "connected" | "disconnected";

export interface StoryPart {
  text: string;
  backgroundColor?: string;
  font?: number;
}

export interface GeneratedContent {
  parts: StoryPart[];
  currentIndex: number;
}

export interface PostingProgress {
  current: number;
  total: number;
}

export interface StatusMessage {
  type: "success" | "error";
  message: string;
}

export interface EvolutionInstance {
  instanceName: string;
  connectionStatus: string;
  [key: string]: unknown;
}

export interface HistoryEntry {
  id: string | number;
  timestamp: string;
  type: Format;
  instance: string;
  status: "SUCCESS" | "FAILED";
  preview: string;
  details?: string;
  error?: string;
}

export interface AnalyticsData {
  total: number;
  success: number;
  failed: number;
  textCount: number;
  imageCount: number;
}

export interface PostStoryPayload {
  type: Format;
  content: string;
  caption?: string;
  backgroundColor?: string;
  font?: number;
  instanceName?: string;
}
