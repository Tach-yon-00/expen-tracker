// ─── Centralized Configuration ─────────────────────────────────────────────────

// Replace this with your exact local Wi-Fi IP address to test on Physical Device
export const SERVER_URL = "http://10.54.116.75:5000";

// API authentication - must match server's expected key
export const API_KEY = "expense-tracker-secret-key-2024";

// Shared headers that every fetch call should include
export const AUTH_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
};

// ─── Dynamic Currency ─────────────────────────────────────────────────────────
export const getCurrencySymbol = (): string => {
  try {
    const locale =
      typeof Intl !== "undefined"
        ? Intl.NumberFormat().resolvedOptions().locale
        : "en-US";
    if (locale.startsWith("en-IN") || locale === "hi-IN") return "₹";
    if (locale.startsWith("en-GB")) return "£";
    if (locale.startsWith("ja")) return "¥";
    if (
      locale.startsWith("de") ||
      locale.startsWith("fr") ||
      locale.startsWith("it")
    )
      return "€";
    return "$";
  } catch {
    return "$";
  }
};

export const CURRENCY = getCurrencySymbol();

// ─── Date Formatting Helpers ──────────────────────────────────────────────────
export const formatDateDisplay = (dateStr: string | undefined): string => {
  if (!dateStr) return "Today";
  const date = new Date(dateStr);
  const now = new Date();

  // Create versions of the dates set to midnight for accurate day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  // Return actual date for anything older than yesterday
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

// Convert ISO date to DD/MM/YYYY for display
export const isoToDisplay = (iso: string): string => {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// Convert DD/MM/YYYY back to ISO for storage
export const displayToIso = (display: string): string => {
  if (!display) return "";
  // If already ISO format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(display)) return display;
  const parts = display.split("/");
  if (parts.length !== 3) return display;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

// Format date for section headers (Today / Yesterday / Mon, Feb 20)
export const formatDateHeader = (dateStr: string): string => {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (today.getTime() - target.getTime()) / 86400000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

// ─── Contextual Greeting Messages ─────────────────────────────────────────────
export const getContextualTagline = (
  todayCount: number,
  usedPercent: number,
  daysLeft: number
): string => {
  if (usedPercent > 90) return "⚠ You're close to your budget limit";
  if (usedPercent > 75) return "Budget is getting tight — spend wisely";
  if (todayCount === 0) return "No transactions yet today. Add one!";
  if (todayCount >= 3) return `${todayCount} transactions logged today 🔥`;
  if (daysLeft <= 3) return `Only ${daysLeft} days left this month`;
  return "Track your expenses wisely.";
};
