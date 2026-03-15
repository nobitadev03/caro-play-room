
-- Create game rooms table
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  board_size INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  player_x_name TEXT NOT NULL,
  player_x_id TEXT NOT NULL,
  player_o_name TEXT,
  player_o_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game moves table
CREATE TABLE public.game_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  row_idx INTEGER NOT NULL,
  col_idx INTEGER NOT NULL,
  player TEXT NOT NULL CHECK (player IN ('X', 'O')),
  move_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_game_moves_room ON public.game_moves(room_id, move_number);

-- Enable RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;

-- Permissive policies (no auth required for casual game)
CREATE POLICY "Anyone can view rooms" ON public.game_rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create rooms" ON public.game_rooms FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.game_rooms FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can view moves" ON public.game_moves FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create moves" ON public.game_moves FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_moves;
