import fs from "fs";
import path from "path";
import type { ActivityLogEntry } from "@/src/api/types";

const LOG_FILE = path.join(process.cwd(), "activity-log.json");
const MAX_ENTRIES = 50;

let cache: ActivityLogEntry[] | null = null;

function loadFromFile(): ActivityLogEntry[] {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const raw = fs.readFileSync(LOG_FILE, "utf-8");
      const parsed = JSON.parse(raw) as ActivityLogEntry[];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error("[ActivityLog] Failed to load from file:", err);
  }
  return [];
}

function saveToFile(entries: ActivityLogEntry[]) {
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2), "utf-8");
  } catch (err) {
    console.error("[ActivityLog] Failed to save to file:", err);
  }
}

export function getEntries(): ActivityLogEntry[] {
  if (cache === null) {
    cache = loadFromFile();
  }
  // Return last N entries, newest first
  return cache.slice(-MAX_ENTRIES).reverse();
}

export function addEntry(entry: ActivityLogEntry): void {
  if (cache === null) {
    cache = loadFromFile();
  }
  cache.push(entry);

  // Trim to MAX_ENTRIES to prevent unbounded growth
  if (cache.length > MAX_ENTRIES * 2) {
    cache = cache.slice(-MAX_ENTRIES * 2);
  }

  saveToFile(cache);
}

export function deleteEntry(id: string): void {
  if (cache === null) {
    cache = loadFromFile();
  }
  cache = cache.filter((item) => item.id.toString() !== id);
  saveToFile(cache);
}
