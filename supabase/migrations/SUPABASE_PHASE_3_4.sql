-- ============================================
-- CARO PLAY ROOM - Phase 3 & 4 Upgrade
-- ============================================

-- 1. Create Profiles table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  elo_rating INTEGER DEFAULT 1200,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  win_streak INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Guest'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Matchmaking Queue table
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  elo_rating INTEGER NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view queue" ON public.matchmaking_queue FOR SELECT USING (true);
CREATE POLICY "Users can join queue" ON public.matchmaking_queue FOR INSERT WITH CHECK (auth.uid() = player_id);
CREATE POLICY "Users can leave queue" ON public.matchmaking_queue FOR DELETE USING (auth.uid() = player_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;

-- 3. Leaderboard view (optional, just query profiles order by elo_rating desc limit 100)
-- Bật Realtime cho bảng Profiles cập nhật ELO
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
