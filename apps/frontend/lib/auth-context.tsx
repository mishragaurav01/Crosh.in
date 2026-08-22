"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { User, fetchCurrentUser, logout as apiLogout } from "@/lib/auth";

interface AuthContextValue {
  user: User | null;
  csrfToken: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setAuth: (user: User, csrfToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const setAuth = useCallback((u: User, token: string) => {
    setUser(u);
    setCsrfToken(token);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await fetchCurrentUser();
      if (mounted.current) setUser(u);
    } catch {
      if (mounted.current) setError("Failed to load user");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchCurrentUser()
      .then((u) => {
        if (mounted.current) setUser(u);
      })
      .catch(() => {
        if (mounted.current) setError("Failed to load user");
      })
      .finally(() => {
        if (mounted.current) setLoading(false);
      });

    return () => {
      mounted.current = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, csrfToken, loading, error, refresh, setAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
