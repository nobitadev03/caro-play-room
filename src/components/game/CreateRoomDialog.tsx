import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (name: string, boardSize: number, playerName: string) => void;
}

const CreateRoomDialog = ({ open, onOpenChange, onCreateRoom }: CreateRoomDialogProps) => {
  const [roomName, setRoomName] = useState("");
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("caro_player_name") || "");
  const [boardSize, setBoardSize] = useState(15);

  const handleCreate = () => {
    if (!roomName.trim() || !playerName.trim()) return;
    localStorage.setItem("caro_player_name", playerName.trim());
    onCreateRoom(roomName.trim(), boardSize, playerName.trim());
    setRoomName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo phòng mới</DialogTitle>
          <DialogDescription>Đặt tên phòng và chọn kích thước bàn cờ.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="playerName">Tên của bạn</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nhập tên..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roomName">Tên phòng</Label>
            <Input
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="VD: Phòng của tôi"
            />
          </div>
          <div className="space-y-2">
            <Label>Kích thước bàn cờ</Label>
            <div className="flex gap-2">
              {[15, 20].map((size) => (
                <Button
                  key={size}
                  variant={boardSize === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBoardSize(size)}
                  className="flex-1"
                >
                  {size}×{size}
                </Button>
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={handleCreate} disabled={!roomName.trim() || !playerName.trim()}>
            Tạo phòng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;
