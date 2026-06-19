import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { storage } from "@/src/utils/storage";
import {
  darkColors,
  lightColors,
  type ThemeMode,
} from "@/src/theme/colors";

const STORAGE_KEY = "krinterior_theme_mode";

type ThemeState = {
  mode: ThemeMode;
  colors: typeof lightColors;
  setMode: (m: ThemeMode) => Promise<void>;
  toggle: () => Promise<void>;
};

const ThemeContext = createContext<ThemeState | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<ThemeMode>(STORAGE_KEY, "light");
      if (stored === "light" || stored === "dark") setModeState(stored);
    })();
  }, []);

  const setMode = useCallback(async (m: ThemeMode) => {
    setModeState(m);
    await storage.setItem(STORAGE_KEY, m);
  }, []);

  const toggle = useCallback(async () => {
    const next: ThemeMode = mode === "light" ? "dark" : "light";
    await setMode(next);
  }, [mode, setMode]);

  const value = useMemo<ThemeState>(
    () => ({
      mode,
      colors: mode === "dark" ? darkColors : lightColors,
      setMode,
      toggle,
    }),
    [mode, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

export function useColors() {
  return useTheme().colors;
}
