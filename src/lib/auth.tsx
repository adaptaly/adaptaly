"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabaseBrowser } from "./supabaseBrowser";

interface Ctx {
  session: Session | null;
  user: User | null;
  loading: boolean;
}
const AuthCtx = createContext<Ctx>({
  session: null,
  user: null,
  loading: true,
});
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // initial
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    // listener
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange(
      (_event /* "SIGNED_IN" | "SIGNED_OUT" | ... */, s) => {
        setSession(s);
      }
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <AuthCtx.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}