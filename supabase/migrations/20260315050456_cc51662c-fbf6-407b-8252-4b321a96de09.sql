
CREATE POLICY "Anyone can delete moves" ON public.game_moves FOR DELETE TO anon, authenticated USING (true);
