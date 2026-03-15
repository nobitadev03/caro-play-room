-- ============================================
-- CARO PLAY ROOM - ELO & Matchmaking Updates
-- ============================================

-- 1. Add winner_id to game_rooms to track who won easily for ELO calculation
ALTER TABLE public.game_rooms ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES public.profiles(id);

-- 2. Create the ELO update function
CREATE OR REPLACE FUNCTION public.update_elo_on_game_finish()
RETURNS trigger AS $$
DECLARE
  k_factor INTEGER := 32;
  player_x_elo INTEGER;
  player_o_elo INTEGER;
  expected_x NUMERIC;
  expected_o NUMERIC;
  actual_x NUMERIC;
  actual_o NUMERIC;
BEGIN
  -- Only trigger when a game finishes
  IF NEW.status = 'finished' AND OLD.status = 'playing' THEN
    
    -- Ensure both players have profiles
    IF NEW.player_x_id IS NOT NULL AND NEW.player_o_id IS NOT NULL THEN
      
      -- Get current ELOs
      SELECT elo_rating INTO player_x_elo FROM public.profiles WHERE id = NEW.player_x_id::uuid;
      SELECT elo_rating INTO player_o_elo FROM public.profiles WHERE id = NEW.player_o_id::uuid;
      
      -- If both have profiles (meaning they are logged in users)
      IF player_x_elo IS NOT NULL AND player_o_elo IS NOT NULL THEN
      
        -- Calculate expected scores
        expected_x := 1.0 / (1.0 + power(10.0, (player_o_elo - player_x_elo) / 400.0));
        expected_o := 1.0 / (1.0 + power(10.0, (player_x_elo - player_o_elo) / 400.0));
        
        -- Determine actual scores
        IF NEW.winner_id::text = NEW.player_x_id::text THEN
          actual_x := 1.0;
          actual_o := 0.0;
        ELSIF NEW.winner_id::text = NEW.player_o_id::text THEN
          actual_x := 0.0;
          actual_o := 1.0;
        ELSE
          -- Draw
          actual_x := 0.5;
          actual_o := 0.5;
        END IF;
        
        -- Update Player X
        UPDATE public.profiles 
        SET 
          elo_rating = player_x_elo + ROUND(k_factor * (actual_x - expected_x)),
          wins = wins + CASE WHEN actual_x = 1.0 THEN 1 ELSE 0 END,
          losses = losses + CASE WHEN actual_x = 0.0 THEN 1 ELSE 0 END,
          draws = draws + CASE WHEN actual_x = 0.5 THEN 1 ELSE 0 END,
          win_streak = CASE WHEN actual_x = 1.0 THEN win_streak + 1 ELSE 0 END
        WHERE id = NEW.player_x_id::uuid;
        
        -- Update Player O
        UPDATE public.profiles 
        SET 
          elo_rating = player_o_elo + ROUND(k_factor * (actual_o - expected_o)),
          wins = wins + CASE WHEN actual_o = 1.0 THEN 1 ELSE 0 END,
          losses = losses + CASE WHEN actual_o = 0.0 THEN 1 ELSE 0 END,
          draws = draws + CASE WHEN actual_o = 0.5 THEN 1 ELSE 0 END,
          win_streak = CASE WHEN actual_o = 1.0 THEN win_streak + 1 ELSE 0 END
        WHERE id = NEW.player_o_id::uuid;
        
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the Trigger
DROP TRIGGER IF EXISTS on_game_finished_update_elo ON public.game_rooms;
CREATE TRIGGER on_game_finished_update_elo
  AFTER UPDATE ON public.game_rooms
  FOR EACH ROW EXECUTE PROCEDURE public.update_elo_on_game_finish();
