import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";

import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { AuthProvider } from "@/src/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/src/contexts/ThemeContext";
import { fontAssets } from "@/src/theme/fonts";

SplashScreen.preventAutoHideAsync();

function StackWithTheme() {
  const { colors, mode } = useTheme();
  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [iconsLoaded, iconsErr] = useIconFonts();
  const [googleLoaded, googleErr] = useFonts(fontAssets);

  const loaded = iconsLoaded && googleLoaded;
  const error = iconsErr || googleErr;

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <StackWithTheme />
      </AuthProvider>
    </ThemeProvider>
  );
}
