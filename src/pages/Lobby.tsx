import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import CreateRoomDialog from "@/components/game/CreateRoomDialog";
import type { Room } from "@/lib/gameLogic";
import { Plus, Users, Grid3X3 } from "lucide-react";

const Lobby = () => {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: "demo-1",
      name: "Phòng tập luyện",
      hasPassword: false,
      players: 1,
      boardSize: 15,
      status: "waiting",
      createdAt: new Date(),
    },
  ]);

  const handleCreateRoom = (name: string, boardSize: number, playerName: string) => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name,
      hasPassword: false,
      players: 1,
      boardSize,
      status: "waiting",
      createdAt: new Date(),
    };
    setRooms((prev) => [newRoom, ...prev]);
    setShowCreate(false);
    navigate(`/game/${newRoom.id}`, { state: { roomName: name, boardSize, playerName } });
  };

  const handleJoinRoom = (room: Room) => {
    navigate(`/game/${room.id}`, {
      state: { roomName: room.name, boardSize: room.boardSize, playerName: "Người chơi 2" },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Caro Arena</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Trận đấu mới. Chiến thuật mới.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Tạo phòng
        </Button>
      </header>

      {/* Room list */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        <p className="label-text mb-4">Phòng đang chờ</p>

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
                className="flex items-center justify-between p-4 rounded-xl border hover:border-foreground/20 hover:shadow-sm transition-all duration-200 bg-card cursor-pointer group"
                onClick={() => handleJoinRoom(room)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Grid3X3 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{room.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {room.boardSize}×{room.boardSize} • {room.status === "waiting" ? "Đang chờ" : "Đang chơi"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="mono-text text-xs">{room.players}/2</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Tham gia
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </main>

      <CreateRoomDialog open={showCreate} onOpenChange={setShowCreate} onCreateRoom={handleCreateRoom} />
    </div>
  );
};

export default Lobby;
