-- Add turn_deadline to track per-turn time limit
ALTER TABLE public.game_rooms ADD COLUMN turn_deadline TIMESTAMP WITH TIME ZONE;
