import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/gameLogic";

interface GameOverDialogProps {
  open: boolean;
  winner: Player | null;
  playerNames: { X: string; O: string };
  onRematch: () => void;
  onLeave: () => void;
}

const GameOverDialog = ({ open, winner, playerNames, onRematch, onLeave }: GameOverDialogProps) => {
  if (!winner) return null;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Chiến thắng thuộc về{" "}
            <span className={winner === 'X' ? 'text-primary' : 'text-secondary'}>
              {playerNames[winner]}
            </span>
          </DialogTitle>
          <DialogDescription className="text-center">
            Trận đấu kết thúc sau {winner === 'X' ? 'X' : 'O'} hoàn thành chuỗi 5.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" className="flex-1" onClick={onLeave}>
            Rời phòng
          </Button>
          <Button className="flex-1" onClick={onRematch}>
            Tái đấu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
