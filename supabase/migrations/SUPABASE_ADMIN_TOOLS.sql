-- 1. Thêm cột Quyền Admin (is_admin) cho bảng profiles nếu chưa có
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Cập nhật ELO khủng và gắn nhãn Admin cho Email của bạn (Nếu họ đã sign up)
UPDATE public.profiles
SET elo_rating = 9999999, is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'snowstudent03@gmail.com');

-- 3. Cập nhật RLS Policy để cho phép Admin DELETE game_rooms
-- Kiểm tra xem Policy cũ có chưa, nếu có update hoặc tạo mới
CREATE POLICY "Admins can delete any room" 
ON public.game_rooms 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);
