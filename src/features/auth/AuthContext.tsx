import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { User, Session } from "@supabase/supabase-js";
import { getSession, onAuthStateChange, signOut } from "./supabaseAuth";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!session;

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const { data } = await getSession();
        if (!isMounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await signOut();
    setSession(null);
    setUser(null);
    navigate("/", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, session, user, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
