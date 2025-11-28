import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_BASE_URL } from "../config";
import type { User } from "../types/user";

const STORAGE_KEY = "mlr-auth-session";

export type AuthResponse = {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
};

type RegisterPayload = {
  email: string;
  password: string;
  full_name?: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const parseResponseError = async (response: Response): Promise<string> => {
  try {
    const data = await response.json();
    if (typeof data?.error === "string") {
      return data.error;
    }
    if (data?.details && typeof data.details === "object") {
      const first = Object.values(data.details).find((value) => typeof value === "string");
      if (typeof first === "string") {
        return first;
      }
    }
  } catch {
    // response body is not JSON; ignore
  }
  return `Request failed with status ${response.status}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const persistSession = useCallback((payload: AuthResponse) => {
    setUser(payload.user);
    setToken(payload.access_token);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: payload.user, token: payload.access_token })
    );
    setInitializing(false);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    const storedRaw = localStorage.getItem(STORAGE_KEY);
    if (!storedRaw) {
      setInitializing(false);
      return;
    }

    try {
      const stored = JSON.parse(storedRaw) as { user?: User | null; token?: string | null };
      if (!stored?.token) {
        clearSession();
        setInitializing(false);
        return;
      }

      setToken(stored.token);
      setUser(stored.user ?? null);

      const controller = new AbortController();
      (async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${stored.token}`,
            },
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error("Session check failed");
          }
          const data = await response.json();
          if (data?.user) {
            setUser(data.user as User);
          }
        } catch {
          clearSession();
        } finally {
          setInitializing(false);
        }
      })();

      return () => controller.abort();
    } catch {
      clearSession();
      setInitializing(false);
    }
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error(await parseResponseError(response));
      }
      const data = (await response.json()) as AuthResponse;
      persistSession(data);
    },
    [persistSession]
  );

  const register = useCallback(
    async ({ email, password, full_name }: RegisterPayload) => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, full_name }),
      });
      if (!response.ok) {
        throw new Error(await parseResponseError(response));
      }
      const data = (await response.json()) as AuthResponse;
      persistSession(data);
    },
    [persistSession]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, initializing, login, register, logout: clearSession }),
    [clearSession, initializing, login, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
