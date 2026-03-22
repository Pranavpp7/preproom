import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  streak: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("pb_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check localStorage for registered users
    const users = JSON.parse(localStorage.getItem("pb_users") || "[]");
    const found = users.find((u: any) => u.email === email && u.password === password);
    if (!found) throw new Error("Invalid email or password");
    const u: User = { id: found.id, name: found.name, email: found.email, streak: found.streak || 0 };
    localStorage.setItem("pb_user", JSON.stringify(u));
    setUser(u);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem("pb_users") || "[]");
    if (users.find((u: any) => u.email === email)) throw new Error("Email already registered");
    const newUser = { id: crypto.randomUUID(), name, email, password, streak: 0 };
    users.push(newUser);
    localStorage.setItem("pb_users", JSON.stringify(users));
    const u: User = { id: newUser.id, name, email, streak: 0 };
    localStorage.setItem("pb_user", JSON.stringify(u));
    setUser(u);
  };

  const signOut = () => {
    localStorage.removeItem("pb_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
