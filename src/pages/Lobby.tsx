import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import CreateRoomDialog from "@/components/game/CreateRoomDialog";
import JoinRoomDialog from "@/components/game/JoinRoomDialog";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Users, Grid3X3, Loader2, Trash2, Swords, X, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserProfileButton } from "@/components/ui/auth";
import { usePlayerId, useAuth } from "@/components/AuthProvider";
import { useMatchmaking } from "@/hooks/useMatchmaking";

interface RoomRow {
  id: string;
  name: string;
  board_size: number;
  status: string;
  player_x_name: string;
  player_x_id: string;
  player_o_name: string | null;
  player_o_id: string | null;
  created_at: string;
}

const Lobby = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const playerId = usePlayerId();
  const { isSearching, findMatch, cancelSearch } = useMatchmaking();
  const [showCreate, setShowCreate] = useState(false);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoom, setJoiningRoom] = useState<RoomRow | null>(null);

  // Fetch rooms
  useEffect(() => {
    async function fetchRooms() {
      const { data } = await supabase
        .from("game_rooms")
        .select("*")
        .in("status", ["waiting", "playing"])
        .order("created_at", { ascending: false });
      if (data) setRooms(data);
      setLoading(false);

      // Auto-cleanup: Delete waiting rooms older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      await supabase
        .from("game_rooms")
        .delete()
        .eq("status", "waiting")
        .lt("created_at", oneHourAgo);
    }
    fetchRooms();

    // Realtime subscription
    const channel = supabase
      .channel("lobby-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rooms" },
        () => { fetchRooms(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreateRoom = async (name: string, boardSize: number, playerName: string) => {
    const { data, error } = await supabase
      .from("game_rooms")
      .insert({
        name,
        board_size: boardSize,
        player_x_name: playerName,
        player_x_id: playerId,
        status: "waiting",
        rematch_x_ready: false,
        rematch_o_ready: false,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to create room:", error);
      return;
    }

    setShowCreate(false);
    navigate(`/game/${data.id}`);
  };

  const handleJoinRoom = (room: RoomRow) => {
    // If I'm already in this room, navigate directly
    if (room.player_x_id === playerId || room.player_o_id === playerId) {
      navigate(`/game/${room.id}`);
      return;
    }
    // If room is full, just navigate as spectator
    if (room.player_o_id) {
      navigate(`/game/${room.id}`);
      return;
    }
    // Show join dialog
    setJoiningRoom(room);
  };

  const handleConfirmJoin = async (playerName: string) => {
    if (!joiningRoom) return;

    const { error } = await supabase
      .from("game_rooms")
      .update({
        player_o_name: playerName,
        player_o_id: playerId,
        status: "playing",
      })
      .eq("id", joiningRoom.id)
      .eq("status", "waiting");

    if (error) {
      console.error("Failed to join room:", error);
      return;
    }

    setJoiningRoom(null);
    navigate(`/game/${joiningRoom.id}`);
  };

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation(); // Avoid triggering join room
    
    // Optimistic UI update
    setRooms(prev => prev.filter(r => r.id !== roomId));

    const { error } = await supabase
      .from("game_rooms")
      .delete()
      .eq("id", roomId);

    if (error) {
      console.error("Failed to delete room:", error);
      // Fetch rooms again to recover state
      const { data } = await supabase
        .from("game_rooms")
        .select("*")
        .in("status", ["waiting", "playing"])
        .order("created_at", { ascending: false });
      if (data) setRooms(data);
    }
  };

  const getPlayerCount = (room: RoomRow) => room.player_o_id ? 2 : 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Caro Arena</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Trận đấu mới. Chiến thuật mới.</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => navigate('/leaderboard')} className="text-yellow-600 dark:text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-500/10">
            <Trophy className="w-4 h-4" />
          </Button>
          <UserProfileButton />
          <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2 shrink-0 ml-1">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo phòng</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        <div className="mb-6 bg-card border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Swords className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Chế độ Xếp Hạng</h2>
          <p className="text-sm text-muted-foreground w-full sm:max-w-[80%]">
            Hệ thống sẽ tự động tìm kiếm đối thủ có cùng trình độ (ELO) với bạn. Cả 2 sẽ thi đấu trên bàn cờ tiêu chuẩn 15x15.
          </p>
          {isSearching ? (
             <Button variant="destructive" className="mt-2 w-full sm:w-auto min-w-[200px]" onClick={cancelSearch}>
               <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               Đang tìm trận... Hủy
             </Button>
          ) : (
            <Button className="mt-2 w-full sm:w-auto min-w-[200px] text-base h-11" onClick={findMatch}>
              Chơi Ngay
            </Button>
          )}
        </div>

        <p className="label-text mb-4">Phòng đang chờ</p>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {rooms.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 text-muted-foreground"
              >
                <p className="text-sm">Chưa có phòng nào. Hãy tạo phòng mới!</p>
              </motion.div>
            )}

            <div className="space-y-2">
              {rooms.map((room) => (
                <motion.div
                  key={room.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border hover:border-foreground/20 hover:shadow-sm transition-all duration-200 bg-card cursor-pointer group"
                  onClick={() => handleJoinRoom(room)}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                      <Grid3X3 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{room.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {room.board_size}×{room.board_size} •{" "}
                        {room.status === "waiting" ? "Đang chờ" : "Đang chơi"} •{" "}
                        <span className="text-foreground/60">{room.player_x_name}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 px-1 sm:px-0">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="mono-text text-xs">{getPlayerCount(room)}/2</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {((room.player_x_id === playerId && room.status === "waiting") || profile?.is_admin) && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive w-8 h-8 opacity-100"
                          onClick={(e) => handleDeleteRoom(e, room.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {getPlayerCount(room) < 2 ? "Tham gia" : "Xem"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>

      <CreateRoomDialog open={showCreate} onOpenChange={setShowCreate} onCreateRoom={handleCreateRoom} />
      <JoinRoomDialog
        open={!!joiningRoom}
        onOpenChange={(open) => !open && setJoiningRoom(null)}
        roomName={joiningRoom?.name || ""}
        onJoin={handleConfirmJoin}
      />
    </div>
  );
};

export default Lobby;
