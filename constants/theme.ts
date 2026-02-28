/**
 * Yochan UI Theme
 * Centralized design tokens for colors, spacing, and typography
 */

export const COLORS = {
  // Brand (Cyan / Teal)
  primary: "#0EA5E9", // Cyan/Light Blue from image
  primaryLight: "#E0F2FE",
  primaryDark: "#0284C7",

  // Semantic
  success: "#10B981",
  successLight: "#D1FAE5",
  danger: "#EF4444", // Bright red for negative transactions
  dangerLight: "#FEE2E2",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  info: "#38BDF8",
  infoLight: "#E0F2FE",

  // Neutrals (Tinted with blue)
  white: "#FFFFFF",
  gray50: "#F4F6F8", // Very light blue-grey for cards
  gray100: "#E2E8F0", // Light blue-grey for borders
  gray200: "#CBD5E1",
  gray300: "#94A3B8",
  gray400: "#64748B",
  gray500: "#475569",
  gray600: "#334155",
  gray700: "#1E293B",
  gray800: "#0F172A",
  gray900: "#0B0F19",

  // Application Specific
  background: "#dbeafe", // Light opacity faded blue from add transactions screen
  textHeader: "#0F4666", // Dark teal for titles like "Transactions"
  textMain: "#1E293B",
  textSecondary: "#475569",
  textSub: "#64748B",
  textMuted: "#94A3B8",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: COLORS.textHeader,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: COLORS.textHeader,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: COLORS.textHeader,
  },
  subheader: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: COLORS.textSub,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: COLORS.textMain,
  },
  bodyBold: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: COLORS.gray800,
  },
  bodySmall: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    color: COLORS.textSub,
  },
  tiny: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
};

export const SHADOWS = {
  soft: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  medium: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  md: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  lg: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  primary: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export default {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
};

// Colors export for backward compatibility
export const Colors = {
  light: {
    icon: COLORS.gray600,
    background: COLORS.background,
    text: COLORS.textMain,
    border: COLORS.gray100,
  },
  dark: {
    icon: COLORS.gray400,
    background: COLORS.gray900,
    text: COLORS.white,
    border: COLORS.gray700,
  },
};
