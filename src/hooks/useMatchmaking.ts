import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export function useMatchmaking() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isSearching || !user) return;

    // Listen to game_rooms for when another player creates a room with our ID
    const channel = supabase.channel(`matchmaking-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "game_rooms" },
        (payload) => {
          const room = payload.new as any;
          if (room.player_o_id === user.id || room.player_x_id === user.id) {
            toast.success("Đã tìm thấy trận đấu!");
            setIsSearching(false);
            navigate(`/game/${room.id}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSearching, user, navigate]);

  const findMatch = async () => {
    if (!user || !profile) {
      toast.error("Bạn cần đăng nhập để tìm trận đấu xếp hạng");
      return;
    }

    setIsSearching(true);

    try {
      // 1. Try to find an opponent in the queue
      const { data: opponents, error: fetchError } = await (supabase as any)
        .from("matchmaking_queue")
        .select("*")
        .neq("player_id", user.id)
        .order("joined_at", { ascending: true })
        .limit(1);

      if (fetchError) throw fetchError;

      if (opponents && opponents.length > 0) {
        const opponent = opponents[0];

        // 2. We found someone! Let's lock them by deleting them from the queue
        // In a real app we'd use a server function to prevent race conditions, but this works for simple apps.
        const { error: delError } = await (supabase as any)
          .from("matchmaking_queue")
          .delete()
          .eq("player_id", opponent.player_id);

        if (!delError) {
          // Successfully removed opponent from queue, meaning we "claimed" them.
          // Randomize who goes first (X goes first)
          const isX = Math.random() > 0.5;

          const { data: room, error: roomError } = await supabase
            .from("game_rooms")
            .insert({
              name: `Ranked: ${profile.display_name} vs Khách`,
              board_size: 15,
              player_x_id: isX ? user.id : opponent.player_id,
              player_x_name: isX ? profile.display_name : "Đối thủ",
              player_o_id: isX ? opponent.player_id : user.id,
              player_o_name: isX ? "Đối thủ" : profile.display_name,
              status: "playing",
              turn_deadline: new Date(Date.now() + 30 * 1000).toISOString(),
            })
            .select()
            .single();

          if (roomError || !room) throw roomError;

          toast.success("Đã tạo trận đấu thành công!");
          setIsSearching(false);
          navigate(`/game/${room.id}`);
          return;
        }
      }

      // 3. No opponent found, or race condition failed. Add ourselves to the queue.
      const { error: insertError } = await (supabase as any)
        .from("matchmaking_queue")
        .upsert({
          player_id: user.id,
          elo_rating: profile.elo_rating,
        });

      if (insertError) throw insertError;
      
      toast.info("Đang tìm kiếm đối thủ...");
      // The useEffect will catch when someone else pairs with us

    } catch (err: any) {
      console.error(err);
      toast.error("Lỗi tìm trận: " + err.message);
      setIsSearching(false);
    }
  };

  const cancelSearch = async () => {
    if (!user) return;
    setIsSearching(false);
    await (supabase as any).from("matchmaking_queue").delete().eq("player_id", user.id);
    toast.info("Đã hủy tìm trận chờ");
  };

  // Clean up queue on unmount or tab close
  useEffect(() => {
    const handleUnload = () => {
      if (isSearching && user) {
        // Synchronously delete
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        navigator.sendBeacon(`${supabaseUrl}/rest/v1/matchmaking_queue?player_id=eq.${user.id}`, "");
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      // Also cleanup when component unmounts normally
      if (isSearching) cancelSearch();
    };
  }, [isSearching, user]);

  return { isSearching, findMatch, cancelSearch };
}
