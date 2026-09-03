import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format total seconds into a readable string (e.g., "1h 25m 30s", "45m 12s", or "50s")
 */
export function formatSecondsToHMS(totalSeconds: number): string {
  const sec = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(" ");
}

/**
 * Format hours or seconds into human readable duration
 */
export function formatDuration(hours?: number, seconds?: number): string {
  if (seconds && seconds > 0) {
    return formatSecondsToHMS(seconds);
  }
  if (hours && hours > 0) {
    return formatSecondsToHMS(Math.round(hours * 3600));
  }
  return "0s";
}
