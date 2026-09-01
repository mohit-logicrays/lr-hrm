"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, User } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  permissions: Record<string, Record<string, boolean>>;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  permissions: {},
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await api.me();
      setUser(res.data.user);
      setPermissions(res.data.permissions ?? {});
    } catch {
      setUser(null);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setPermissions({});
      router.replace("/login");
    }
  }, [router]);

  // Load session once on mount; /login handles its own redirect
  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ user, permissions, loading, refresh, logout }),
    [user, permissions, loading, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Centralized client-side permission check — mirrors backend authorize() */
export function usePermission(modelName: string) {
  const { user, permissions } = useAuth();
  if (user?.role === "superadmin") {
    return { create: true, read: true, update: true, delete: true };
  }
  return permissions[modelName] ?? {};
}
