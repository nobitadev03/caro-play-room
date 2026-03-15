-- 1. Cập nhật Hàm Tính ELO để hỗ trợ người chơi Khách (Guest)
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
  -- Chỉ chạy khi trận đấu chuyển từ 'playing' sang 'finished'
  IF NEW.status = 'finished' AND OLD.status = 'playing' THEN
    
    -- Lấy ELO hiện tại, nếu ĐỐI THỦ không có profile (Khách), mặc định cho elo = 1200
    SELECT elo_rating INTO player_x_elo FROM public.profiles WHERE id = NEW.player_x_id::uuid;
    SELECT elo_rating INTO player_o_elo FROM public.profiles WHERE id = NEW.player_o_id::uuid;
    
    -- Đặt mặc định 1200 điểm cho các tài khoản Khách vô danh để có thể tính điểm cho Admin
    IF player_x_elo IS NULL THEN player_x_elo := 1200; END IF;
    IF player_o_elo IS NULL THEN player_o_elo := 1200; END IF;

    -- Tính toán Xác suất thắng (Expected Score)
    expected_x := 1.0 / (1.0 + power(10.0, (player_o_elo - player_x_elo) / 400.0));
    expected_o := 1.0 / (1.0 + power(10.0, (player_x_elo - player_o_elo) / 400.0));
    
    -- Xác định kết quả thực tế
    IF NEW.winner_id::text = NEW.player_x_id::text THEN
      actual_x := 1.0;
      actual_o := 0.0;
    ELSIF NEW.winner_id::text = NEW.player_o_id::text THEN
      actual_x := 0.0;
      actual_o := 1.0;
    ELSE
      actual_x := 0.5;
      actual_o := 0.5;
    END IF;

    -- Cập nhật cho Người chơi X (Nếu họ là người dùng đăng nhập - có profile)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.player_x_id::uuid) THEN
        UPDATE public.profiles 
        SET 
          elo_rating = player_x_elo + ROUND(k_factor * (actual_x - expected_x)),
          wins = wins + CASE WHEN actual_x = 1.0 THEN 1 ELSE 0 END,
          losses = losses + CASE WHEN actual_x = 0.0 THEN 1 ELSE 0 END,
          draws = draws + CASE WHEN actual_x = 0.5 THEN 1 ELSE 0 END,
          win_streak = CASE WHEN actual_x = 1.0 THEN win_streak + 1 ELSE 0 END
        WHERE id = NEW.player_x_id::uuid;
    END IF;

    -- Cập nhật cho Người chơi O (Nếu họ là người dùng đăng nhập - có profile)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.player_o_id::uuid) THEN
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
