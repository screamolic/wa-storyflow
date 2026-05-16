import { checkConnection } from "../services/evolution";

const CACHE_TTL_MS = 60_000; // 1 minute

let cachedStatus: "connected" | "disconnected" | "unknown" = "unknown";
let cachedAt = 0;

/**
 * Get connection status with 60s cache to avoid hammering Evolution API.
 */
export async function getConnectionStatus(): Promise<"connected" | "disconnected"> {
  const now = Date.now();

  if (cachedStatus !== "unknown" && now - cachedAt < CACHE_TTL_MS) {
    return cachedStatus === "connected" ? "connected" : "disconnected";
  }

  const connected = await checkConnection();
  cachedStatus = connected ? "connected" : "disconnected";
  cachedAt = now;

  return connected ? "connected" : "disconnected";
}

/**
 * Force refresh the cached status.
 */
export async function refreshConnectionStatus(): Promise<"connected" | "disconnected"> {
  cachedAt = 0; // Invalidate cache
  return getConnectionStatus();
}
