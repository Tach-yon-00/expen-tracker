import { Ionicons } from "@expo/vector-icons";

// Centralized Category Branding
// This is the source of truth for colors, icons, and background styles
export const CATEGORY_BRANDING: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  // Expense Categories
  "Food & Dining": { color: "#FF6B6B", icon: "fast-food-outline", bg: "#FFF0F0" },
  "Food": { color: "#FF6B6B", icon: "fast-food-outline", bg: "#FFF0F0" },
  "Transport": { color: "#F59E0B", icon: "car-outline", bg: "#FFF8E7" },
  "Transportation": { color: "#F59E0B", icon: "car-outline", bg: "#FFF8E7" },
  "Bills": { color: "#3B82F6", icon: "receipt-outline", bg: "#EFF6FF" },
  "Bills & Utilities": { color: "#3B82F6", icon: "receipt-outline", bg: "#EFF6FF" },
  "Shopping": { color: "#EC4899", icon: "bag-handle-outline", bg: "#FDF2F8" },
  "Healthcare": { color: "#22C55E", icon: "medkit-outline", bg: "#F0FDF4" },
  "Medics": { color: "#22C55E", icon: "medkit-outline", bg: "#F0FDF4" },
  "Entertainment": { color: "#8B5CF6", icon: "musical-notes-outline", bg: "#F3E8FF" },
  "Subscriptions": { color: "#8B5CF6", icon: "musical-notes-outline", bg: "#F3E8FF" },
  "Others": { color: "#9CA3AF", icon: "ellipsis-horizontal-outline", bg: "#F3F4F6" },
  "Other": { color: "#9CA3AF", icon: "ellipsis-horizontal-outline", bg: "#F3F4F6" },

  // Income Categories
  "Salary": { color: "#22c55e", icon: "cash-outline", bg: "#22c55e20" },
  "Freelance": { color: "#3b82f6", icon: "laptop-outline", bg: "#3b82f620" },
  "Business": { color: "#8b5cf6", icon: "briefcase-outline", bg: "#8b5cf620" },
  "Investment": { color: "#eab308", icon: "trending-up", bg: "#eab30820" },
  "Other Income": { color: "#6b7280", icon: "add-circle-outline", bg: "#6b728020" },
};

export const FALLBACK_BRANDING = {
  color: "#9CA3AF",
  icon: "ellipsis-horizontal-outline" as keyof typeof Ionicons.glyphMap,
  bg: "#F3F4F6"
};

/**
 * Helper to get branding for a category name.
 * Checks against defaults and custom categories provided in the list.
 */
export const getCategoryBranding = (
  name: string,
  customCategories: any[] = []
): { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string } => {
  if (!name) return FALLBACK_BRANDING;

  const nameLower = name.toLowerCase();

  // 1. Check exact match in hardcoded branding
  if (CATEGORY_BRANDING[name]) return CATEGORY_BRANDING[name];

  // 2. Check match in custom categories (state)
  const custom = customCategories.find(c => c.title === name || c.title.toLowerCase() === nameLower);
  if (custom) {
    return {
      color: custom.color,
      icon: (custom.icon as keyof typeof Ionicons.glyphMap) || "ellipsis-horizontal-outline",
      bg: custom.color + "20"
    };
  }

  // 3. Check simplified title (e.g. "Food & Dining" -> "Food")
  const simplified = name.split(' ')[0];
  if (CATEGORY_BRANDING[simplified]) return CATEGORY_BRANDING[simplified];

  // 4. Case-insensitive and partial match against defaults
  for (const key of Object.keys(CATEGORY_BRANDING)) {
    if (key.toLowerCase().includes(nameLower) || nameLower.includes(key.toLowerCase())) {
      return CATEGORY_BRANDING[key];
    }
  }

  // 5. Return fallback
  return FALLBACK_BRANDING;
};

// Legacy exports for backward compatibility if needed, but prefer getCategoryBranding
export const DEFAULT_CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_BRANDING).map(([k, v]) => [k, v.color])
);

// Categories that cannot be deleted
export const PROTECTED_CATEGORY_TITLES = [
  "Food & Dining",
  "Food",
  "Transportation",
  "Transport",
  "Bills & Utilities",
  "Bills",
  "Shopping",
  "Healthcare",
  "Health",
  "Medics",
  "Entertainment",
  "Subscriptions",
  "Others",
  "Other"
];

export const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Bills & Utilities",
  "Shopping",
  "Healthcare",
  "Entertainment",
  "Other"
];
