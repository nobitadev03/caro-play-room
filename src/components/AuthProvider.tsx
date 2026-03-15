import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  display_name: string;
  elo_rating: number;
  wins: number;
  losses: number;
  draws: number;
  win_streak: number;
}

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => void;
  guestId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate a unique fallback guest ID per browser (persists across tabs)
function getGuestId(): string {
  let id = localStorage.getItem("caro_player_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("caro_player_id", id);
  }
  return id;
}
const fallbackGuestId = getGuestId();

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    // Cast supabase to any to bypass strict generated types that don't have 'profiles' yet
    const { data, error } = await (supabase as any).from('profiles').select('*').eq('id', userId).maybeSingle();
    // if profile is just created by trigger, we might need a small delay or retry, but maybeSingle works well enough
    if (data) setProfile(data as Profile);
    setLoading(false);
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, guestId: fallbackGuestId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper: use whatever ID is relevant (User ID if logged in, else Guest ID)
export const usePlayerId = () => {
  const { user, guestId } = useAuth();
  return user?.id || guestId;
};
