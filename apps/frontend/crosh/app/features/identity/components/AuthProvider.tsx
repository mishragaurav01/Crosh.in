"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe, logout as apiLogout, AuthApiError } from "../api/auth";

interface User {
  id: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  csrfToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, csrfToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data.user);
      })
      .catch((err) => {
        if (err instanceof AuthApiError && err.code === "UNAUTHENTICATED") {
          // Treat as logged-out — no error shown
          setUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setAuth = useCallback((u: User, token: string) => {
    setUser(u);
    setCsrfToken(token);
  }, []);

  const logout = useCallback(async () => {
    if (csrfToken) {
      try {
        await apiLogout(csrfToken);
      } catch {
        // Session may already be invalid — clear local state regardless
      }
    }
    setUser(null);
    setCsrfToken(null);
  }, [csrfToken]);

  const value = useMemo(
    () => ({ user, csrfToken, isLoading, setAuth, logout }),
    [user, csrfToken, isLoading, setAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
