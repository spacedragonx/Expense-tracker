import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import authApi from "@/api/authApi";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setIsLoading(false));
  }, [refreshProfile]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    setUser(data.data);
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await authApi.register({ name, email, password });
    setUser(data.data);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
