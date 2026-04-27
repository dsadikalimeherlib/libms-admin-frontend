"use client"
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { AuthUser } from "@/lib/mock-library-api";

type Session = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  session: Session | null;
  signIn: (session: Session) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session?.token),
      session,
      signIn: (nextSession) => setSession(nextSession),
      signOut: () => setSession(null),
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
