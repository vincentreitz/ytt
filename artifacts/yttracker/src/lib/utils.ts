import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDurationText(seconds: number | undefined | null): string {
  if (!seconds) return "0 min";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${m}m`;
}

export function extractYoutubeVideoId(urlOrId: string): string {
  const match = urlOrId.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
  return match ? match[1] : urlOrId;
}

export function extractYoutubeChannelId(urlOrId: string): string {
  // Simple extraction, handles full URLs or IDs
  const match = urlOrId.match(/(?:channel\/|c\/|@)([A-Za-z0-9_-]+)/);
  return match ? match[1] : urlOrId;
}
