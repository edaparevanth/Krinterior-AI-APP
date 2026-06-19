import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  api,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "@/src/api/client";

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string | null;
  created_at?: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const res = await api.get<AuthUser>("/auth/me");
      setUser(res.data);
    } catch {
      await clearAuthToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadMe();
      setLoading(false);
    })();
  }, [loadMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    await setAuthToken(res.data.access_token);
    setUser(res.data.user);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const res = await api.post("/auth/signup", {
        email,
        password,
        full_name: fullName,
      });
      await setAuthToken(res.data.access_token);
      setUser(res.data.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await clearAuthToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut, refresh: loadMe }),
    [user, loading, signIn, signUp, signOut, loadMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
