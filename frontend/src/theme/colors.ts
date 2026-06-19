export type ThemeMode = "light" | "dark";

export const lightColors = {
  primary: "#FF7A00",
  primaryDark: "#E56A00",
  accent: "#FFA64D",
  accentSoft: "#FFE4CC",
  white: "#FFFFFF",
  background: "#F2EBDD",
  surface: "#FFFFFF",
  textMain: "#1A1A1A",
  textMuted: "#6B6B6B",
  textSubtle: "#9B9B9B",
  border: "#E5E0D2",
  borderLight: "#EAE3D2",
  error: "#E5484D",
  success: "#10B981",
  warning: "#F59E0B",
  scoreLow: "#E5484D",
  scoreMed: "#F59E0B",
  scoreHigh: "#10B981",
  shadow: "rgba(0,0,0,0.08)",
  orangeGlow: "rgba(255,122,0,0.18)",
  pastelOrange: "#FCD9B8",
  pastelGold: "#EFD9B0",
  pastelLilac: "#E1D8F5",
  pastelMint: "#CFE8DC",
  tabBar: "#F2EBDD",
  tabBarInactive: "#9F968A",
};

export const darkColors: typeof lightColors = {
  primary: "#FF8A1A",
  primaryDark: "#E56A00",
  accent: "#FFA64D",
  accentSoft: "#3A2615",
  white: "#1A1714",
  background: "#0F0D0B",
  surface: "#1B1815",
  textMain: "#F6EFE2",
  textMuted: "#B0A89A",
  textSubtle: "#7A7368",
  border: "#2A2520",
  borderLight: "#221F1B",
  error: "#FF6B6B",
  success: "#34D399",
  warning: "#FBBF24",
  scoreLow: "#FF6B6B",
  scoreMed: "#FBBF24",
  scoreHigh: "#34D399",
  shadow: "rgba(0,0,0,0.5)",
  orangeGlow: "rgba(255,138,26,0.25)",
  pastelOrange: "#3A2615",
  pastelGold: "#332811",
  pastelLilac: "#241F33",
  pastelMint: "#142A20",
  tabBar: "#0F0D0B",
  tabBarInactive: "#6B6457",
};

// Default export – static light palette for backward compatibility with existing screens.
export const colors = lightColors;

export const radii = { sm: 10, md: 14, lg: 22, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };
