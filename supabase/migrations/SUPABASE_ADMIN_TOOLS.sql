-- 1. Thêm cột Quyền Admin (is_admin) cho bảng profiles nếu chưa có
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Cập nhật ELO khủng và gắn nhãn Admin cho Email của bạn (Nếu họ đã sign up)
UPDATE public.profiles
SET elo_rating = 9999999, is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'snowstudent03@gmail.com');

-- 3. Cập nhật RLS Policy để cho phép Admin DELETE game_rooms
CREATE POLICY "Admins can delete any room" 
ON public.game_rooms 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- 4. Ép buộc ON DELETE CASCADE cho game_moves để khi xóa phòng sẽ tự động xóa nước đánh
-- Đoạn mã này sẽ tự động tìm tên Ràng buộc Khóa ngoại và tạo lại nó với CASCADE
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu USING (constraint_name)
        WHERE tc.table_name = 'game_moves' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'room_id'
    LOOP
        EXECUTE 'ALTER TABLE public.game_moves DROP CONSTRAINT ' || r.constraint_name;
    END LOOP;
END $$;

ALTER TABLE public.game_moves 
ADD CONSTRAINT game_moves_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES public.game_rooms(id) ON DELETE CASCADE;
