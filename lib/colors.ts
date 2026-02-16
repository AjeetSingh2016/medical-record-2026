export const colors = {
  // Light Mode
  light: {
    primary: "#0F766E",
    primaryHover: "#0D9488",
    primaryLight: "#14B8A6",
    accent: "#5EEAD4",
    background: "#F9FAFB",
    card: "#FFFFFF",
    border: "#E2E8F0",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textTertiary: "#64748B",
    error: "#EF4444",
    errorLight: "#FEE2E2",
    success: "#22C55E",
    successLight: "#D1FAE5",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
  },

  // Dark Mode
  dark: {
    primary: "#14B8A6",
    primaryHover: "#2DD4BF",
    primaryLight: "#14B8A6", // Same as primary in dark mode
    accent: "#5EEAD4",
    background: "#0B1120",
    card: "#1E293B",
    border: "#334155",
    textPrimary: "#F1F5F9",
    textSecondary: "#94A3B8",
    textTertiary: "#64748B",
    error: "#EF4444",
    errorLight: "#FEE2E2",
    success: "#22C55E",
    successLight: "#D1FAE5",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
  },
};

// Helper function to get color based on theme
export const getColor = (
  isDark: boolean,
  colorKey: keyof typeof colors.light,
) => {
  return isDark ? colors.dark[colorKey] : colors.light[colorKey];
};
