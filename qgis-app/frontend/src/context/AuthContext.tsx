import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  UserProfile,
  apiGetCurrentUser,
  apiLogin,
  apiLogout,
  setTokens,
  clearTokens,
  getAccessToken,
} from "../utils/api";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => "Not initialized",
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Seed from window globals set by Django template (avoids a round-trip)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!getAccessToken()) {
      // Fallback: check if Django says the user is already logged in
      const win = window as any;
      if (win.isAuthenticated) {
        setUser({
          id: 0,
          username: win.username || "",
          first_name: win.userFirstName || "",
          last_name: win.userLastName || "",
          email: "",
          is_staff: win.isStaff || false,
          is_trusted: false,
          plugins_count: 0,
          date_joined: "",
        });
      }
      setIsLoading(false);
      return;
    }
    const { data } = await apiGetCurrentUser();
    setUser(data ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(
    async (username: string, password: string): Promise<string | null> => {
      const { data, error } = await apiLogin(username, password);
      if (data) {
        setTokens(data.access, data.refresh);
        await fetchUser();
        return null;
      }
      return error ?? "Login failed";
    },
    [fetchUser]
  );

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    clearTokens();
    window.location.href = "/accounts/logout/";
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
