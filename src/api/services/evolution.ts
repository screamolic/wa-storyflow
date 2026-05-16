import axios, { type AxiosInstance } from "axios";
import type {
  EvolutionInstanceRaw,
  EvolutionInstance,
  StoryPayload,
} from "../types";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;
const REQUEST_TIMEOUT_MS = 60000;

interface BackendConfig {
  backendType: "evolution" | "waha" | "custom";
  baseUrl: string;
  apiKey: string;
}

function getApiUrl(customConfig?: BackendConfig): string | undefined {
  return (customConfig?.baseUrl || process.env.EVOLUTION_API_URL)?.trim();
}

function getApiKey(customConfig?: BackendConfig): string | undefined {
  return (customConfig?.apiKey || process.env.EVOLUTION_API_KEY)?.trim();
}

function getBackendType(customConfig?: BackendConfig): string {
  return customConfig?.backendType || "evolution";
}

function normalizeBaseUrl(url: string): string {
  if (!url.endsWith("/")) {
    return url + "/";
  }
  return url;
}

let _client: AxiosInstance | null = null;
let _currentBaseUrl = "";
let _currentApiKey = "";
let _currentBackendType = "";

function getClient(baseUrl: string, apiKey: string, backendType: string): AxiosInstance {
  const normBaseUrl = normalizeBaseUrl(baseUrl);
  
  if (!_client || _currentBaseUrl !== normBaseUrl || _currentApiKey !== apiKey || _currentBackendType !== backendType) {
    _client = axios.create({
      timeout: REQUEST_TIMEOUT_MS,
      baseURL: normBaseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (backendType === "waha") {
      _client.defaults.headers["X-Api-Key"] = apiKey;
    } else {
      _client.defaults.headers["apikey"] = apiKey;
    }
    _currentBaseUrl = normBaseUrl;
    _currentApiKey = apiKey;
    _currentBackendType = backendType;
  }
  return _client;
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, isIdempotent = true): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    if (retries <= 0) throw err;

    const error = err as { response?: { status?: number }; code?: string; message?: string };
    
    const isClientAuthError = error.response?.status && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429;
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout');
    const isServerError = error.response?.status && error.response.status >= 500;

    if (!isIdempotent && (isTimeout || isServerError)) {
      console.warn(`[API] Request timed out or server error on non-idempotent action. Not retrying.`);
      throw err;
    }

    if (isClientAuthError) {
      throw err;
    }

    console.warn(`[API] Request failed, retrying... (${retries} left)`, error.message);
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return withRetry(fn, retries - 1, isIdempotent);
  }
}

export async function checkConnection(config?: BackendConfig): Promise<boolean> {
  const apiUrl = getApiUrl(config);
  const apiKey = getApiKey(config);
  const backendType = getBackendType(config);

  if (!apiUrl || !apiKey) return false;

  const client = getClient(apiUrl, apiKey, backendType);

  try {
    if (backendType === "waha") {
      await client.get("api/sessions");
    } else {
      await client.get("instance/fetchInstances");
    }
    return true;
  } catch {
    try {
      if (backendType === "waha") return false;
      await client.get("instance/connectionState");
      return true;
    } catch {
      return false;
    }
  }
}

export async function fetchInstances(config?: BackendConfig): Promise<EvolutionInstance[]> {
  const apiUrl = getApiUrl(config);
  const apiKey = getApiKey(config);
  const backendType = getBackendType(config);

  if (!apiUrl || !apiKey) {
    throw new Error("API configuration is missing.");
  }

  const client = getClient(apiUrl, apiKey, backendType);

  if (backendType === "waha") {
    // WAHA fetch instances
    const response = await withRetry(() => client.get("api/sessions"));
    const instancesRaw = response.data || [];
    return instancesRaw.map((s: any) => ({
      instanceName: s.name,
      connectionStatus: s.status,
      ownerJid: s.me?.id,
      phoneNumber: s.me?.id ? s.me.id.split('@')[0] : undefined,
    }));
  }

  // Evolution API
  const response = await withRetry(() =>
    client.get<EvolutionInstanceRaw[]>("instance/fetchInstances")
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
  instanceName: string,
  config?: BackendConfig
): Promise<unknown> {
  const apiUrl = getApiUrl(config);
  const apiKey = getApiKey(config);
  const backendType = getBackendType(config);

  if (!apiUrl || !apiKey) {
    throw new Error("API configuration is missing.");
  }

  const client = getClient(apiUrl, apiKey, backendType);

  if (backendType === "waha") {
    // Basic WAHA post story (text only for now as WAHA might require different format for image)
    const wahaPayload: any = {
      session: instanceName,
      contacts: ["status@broadcast"],
    };
    if (payload.type === "text") {
      wahaPayload.text = payload.content;
      wahaPayload.backgroundColor = payload.backgroundColor;
      wahaPayload.font = payload.font;
    } else {
      wahaPayload.image = payload.content;
      wahaPayload.caption = payload.caption;
    }
    const response = await withRetry(
      () => client.post(`api/sendText`, wahaPayload),
      MAX_RETRIES,
      false
    );
    return response.data;
  }

  // Evolution API
  const response = await withRetry(
    () => client.post(`message/sendStatus/${instanceName}`, payload),
    MAX_RETRIES,
    false
  );

  return response.data;
}

function normalizeInstance(item: EvolutionInstanceRaw): EvolutionInstance {
  const inst = item.instance && typeof item.instance === "object"
    ? item.instance
    : item;

  const name = (inst.instanceName || inst.name || item.instanceName || item.name) as string;
  const status = (inst.connectionStatus || inst.status || item.connectionStatus || item.status) as string;

  const ownerJid = inst.ownerJid as string | undefined;
  const phoneNumber = ownerJid ? ownerJid.replace("@s.whatsapp.net", "") : undefined;

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
