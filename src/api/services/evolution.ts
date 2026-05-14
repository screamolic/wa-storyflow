import axios, { type AxiosInstance } from "axios";
import type {
  EvolutionInstanceRaw,
  EvolutionInstance,
  StoryPayload,
} from "@/src/api/types";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 60000; // Increased to 60s for image/video uploads

function getApiUrl(): string | undefined {
  return process.env.EVOLUTION_API_URL;
}

function getApiKey(): string | undefined {
  return process.env.EVOLUTION_API_KEY;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Reusable axios instance with timeout and sane defaults.
 * Created lazily to avoid issues during module load.
 */
let _client: AxiosInstance | null = null;

function getClient(baseUrl: string, apiKey: string): AxiosInstance {
  if (!_client) {
    _client = axios.create({
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
    });
  }
  // Update base URL and key if config changed (hot reload scenario)
  _client.defaults.baseURL = normalizeBaseUrl(baseUrl);
  _client.defaults.headers.apikey = apiKey;
  return _client;
}

/**
 * Retry wrapper with exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, isIdempotent = true): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (retries <= 0) throw err;

    const error = err as { response?: { status?: number }; code?: string; message?: string };
    
    // Don't retry client errors like 403, 401, 400 (except maybe 429)
    const isClientAuthError = error.response?.status && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429;
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout');
    const isServerError = error.response?.status && error.response.status >= 500;

    // Do NOT retry on timeouts or server errors for non-idempotent requests (like posting stories)
    // because the server might still be processing it and retrying will create duplicates.
    if (!isIdempotent && (isTimeout || isServerError)) {
      console.warn(`[Evolution API] Request timed out or server error on non-idempotent action. Not retrying to prevent duplicates.`);
      throw err;
    }

    if (isClientAuthError) {
      throw err;
    }

    console.warn(`[Evolution API] Request failed, retrying... (${retries} left)`, error.message);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return withRetry(fn, retries - 1, isIdempotent);
  }
}

export async function checkConnection(): Promise<boolean> {
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();

  if (!apiUrl || !apiKey) return false;

  const client = getClient(apiUrl, apiKey);

  // Try fetchInstances first
  try {
    await client.get("/instance/fetchInstances");
    return true;
  } catch {
    // Fallback to connectionState
    try {
      await client.get("/instance/connectionState");
      return true;
    } catch {
      return false;
    }
  }
}

export async function fetchInstances(): Promise<EvolutionInstance[]> {
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();

  if (!apiUrl || !apiKey) {
    throw new Error("Evolution API configuration is missing.");
  }

  const client = getClient(apiUrl, apiKey);

  const response = await withRetry(() =>
    client.get<EvolutionInstanceRaw[]>("/instance/fetchInstances")
  );

  const data = response.data;
  let instances: EvolutionInstanceRaw[] = [];

  if (Array.isArray(data)) {
    instances = data;
  } else if (data && Array.isArray((data as Record<string, unknown>).instances)) {
    instances = (data as Record<string, unknown>).instances as EvolutionInstanceRaw[];
  }

  return instances.map(normalizeInstance);
}

export async function sendStatus(
  payload: StoryPayload,
  instanceName: string
): Promise<unknown> {
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();

  if (!apiUrl || !apiKey) {
    throw new Error("Evolution API configuration is missing.");
  }

  const client = getClient(apiUrl, apiKey);

  const response = await withRetry(
    () => client.post(`/message/sendStatus/${instanceName}`, payload),
    MAX_RETRIES,
    false // not idempotent
  );

  return response.data;
}

function normalizeInstance(item: EvolutionInstanceRaw): EvolutionInstance {
  const inst = item.instance && typeof item.instance === "object"
    ? item.instance
    : item;

  const name = (inst.instanceName || inst.name || item.instanceName || item.name) as string;
  const status = (inst.connectionStatus || inst.status || item.connectionStatus || item.status) as string;

  // Extract phone number from owner JID (e.g. "628123456789@s.whatsapp.net" → "628123456789")
  const ownerJid = inst.ownerJid as string | undefined;
  const phoneNumber = ownerJid ? ownerJid.replace("@s.whatsapp.net", "") : undefined;

  // Extract profile picture URL
  const profilePictureUrl = inst.profilePictureUrl as string | undefined;
  const profileName = inst.profileName as string | undefined;

  return {
    instanceName: name,
    connectionStatus: status,
    ownerJid,
    phoneNumber,
    profilePictureUrl,
    profileName,
  };
}
