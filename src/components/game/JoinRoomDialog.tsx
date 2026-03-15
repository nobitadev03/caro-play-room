import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JoinRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
  onJoin: (playerName: string) => void;
}

const JoinRoomDialog = ({ open, onOpenChange, roomName, onJoin }: JoinRoomDialogProps) => {
  const [playerName, setPlayerName] = useState("");

  const handleJoin = () => {
    if (!playerName.trim()) return;
    onJoin(playerName.trim());
    setPlayerName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tham gia phòng</DialogTitle>
          <DialogDescription>Nhập tên để vào phòng "{roomName}"</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="joinPlayerName">Tên của bạn</Label>
            <Input
              id="joinPlayerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nhập tên..."
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
          </div>
          <Button className="w-full" onClick={handleJoin} disabled={!playerName.trim()}>
            Vào phòng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRoomDialog;
