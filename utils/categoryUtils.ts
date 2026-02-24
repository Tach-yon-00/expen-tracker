import { Ionicons } from "@expo/vector-icons";
import { loadCustomCategories } from "../storage/storage";

// Default category configuration
export const DEFAULT_CATEGORY_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  "Food & Dining": { color: "#FF6B6B", icon: "fast-food-outline", bg: "#FFF0F0" },
  "Food": { color: "#FF6B6B", icon: "fast-food-outline", bg: "#FFF0F0" },
  "Transport": { color: "#F59E0B", icon: "car-outline", bg: "#FFF8E7" },
  "Transportation": { color: "#F59E0B", icon: "car-outline", bg: "#FFF8E7" },
  "Bills": { color: "#3B82F6", icon: "receipt-outline", bg: "#EFF6FF" },
  "Bills & Utilities": { color: "#3B82F6", icon: "receipt-outline", bg: "#EFF6FF" },
  "Shopping": { color: "#EC4899", icon: "bag-handle-outline", bg: "#FDF2F8" },
  "Medics": { color: "#22C55E", icon: "medkit-outline", bg: "#F0FDF4" },
  "Healthcare": { color: "#22C55E", icon: "medkit-outline", bg: "#F0FDF4" },
  "Subscriptions": { color: "#8B5CF6", icon: "musical-notes-outline", bg: "#F3E8FF" },
  "Entertainment": { color: "#8B5CF6", icon: "musical-notes-outline", bg: "#F3E8FF" },
  "Others": { color: "#9CA3AF", icon: "ellipsis-horizontal-outline", bg: "#F3F4F6" },
  "Other": { color: "#9CA3AF", icon: "ellipsis-horizontal-outline", bg: "#F3F4F6" },
};

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#FF6B6B",
  "Food": "#FF6B6B",
  "Transportation": "#4ECDC4",
  "Transport": "#4ECDC4",
  "Bills & Utilities": "#45B7D1",
  "Bills": "#45B7D1",
  "Shopping": "#F7DC6F",
  "Healthcare": "#BB8FCE",
  "Medics": "#BB8FCE",
  "Entertainment": "#F0A500",
  "Subscriptions": "#8B5CF6",
  "Other": "#ADB5BD",
  "Others": "#ADB5BD",
};

export const DEFAULT_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Bills & Utilities",
  "Shopping",
  "Healthcare",
  "Entertainment",
  "Others"
];

export const fallbackConfig = { 
  color: "#9CA3AF", 
  icon: "ellipsis-horizontal-outline" as keyof typeof Ionicons.glyphMap, 
  bg: "#F3F4F6" 
};

// Get all categories (default + custom)
export const getAllCategories = async (): Promise<string[]> => {
  try {
    const customCategories = await loadCustomCategories();
    const customTitles = customCategories.map(c => c.title);
    // Remove duplicates and return combined list
    return [...new Set([...DEFAULT_CATEGORIES, ...customTitles])];
  } catch {
    return DEFAULT_CATEGORIES;
  }
};

// Get category config including custom categories
export const getCategoryConfig = async (): Promise<Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }>> => {
  try {
    const customCategories = await loadCustomCategories();
    const customConfig: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; bg: string }> = {};
    
    customCategories.forEach(cat => {
      customConfig[cat.title] = {
        color: cat.color,
        icon: cat.icon as keyof typeof Ionicons.glyphMap,
        bg: cat.color + "20" // Add 20% opacity to color for background
      };
    });
    
    return { ...DEFAULT_CATEGORY_CONFIG, ...customConfig };
  } catch {
    return DEFAULT_CATEGORY_CONFIG;
  }
};

// Get category colors including custom categories
export const getCategoryColors = async (): Promise<Record<string, string>> => {
  try {
    const customCategories = await loadCustomCategories();
    const customColors: Record<string, string> = {};
    
    customCategories.forEach(cat => {
      customColors[cat.title] = cat.color;
    });
    
    return { ...DEFAULT_CATEGORY_COLORS, ...customColors };
  } catch {
    return DEFAULT_CATEGORY_COLORS;
  }
};
