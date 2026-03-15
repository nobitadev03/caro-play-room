import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Player } from "@/lib/gameLogic";

interface GameOverDialogProps {
  open: boolean;
  winner: Player | null;
  playerNames: { X: string; O: string };
  myPlayer: Player | null;
  rematchStatus: { x: boolean; o: boolean };
  onRematch: () => void;
  onDecline: () => void;
  onLeave: () => void;
}

const GameOverDialog = ({ open, winner, playerNames, myPlayer, rematchStatus, onRematch, onDecline, onLeave }: GameOverDialogProps) => {
  if (!winner) return null;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {myPlayer === winner ? (
              <span className="text-green-500">🎉 Bạn đã thắng!</span>
            ) : myPlayer !== null ? (
              <span className="text-red-500">💔 Bạn đã thua!</span>
            ) : (
              <span>
                Chiến thắng thuộc về{" "}
                <span className={winner === 'X' ? 'text-primary' : 'text-secondary'}>
                  {playerNames[winner]}
                </span>
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-center">
            Trận đấu kết thúc sau khi {winner === 'X' ? 'X' : 'O'} hoàn thành chuỗi 5.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onLeave}>
            Rời phòng
          </Button>
          
          {myPlayer && (myPlayer === 'X' ? rematchStatus.o : rematchStatus.x) && (
            <Button variant="secondary" className="flex-1" onClick={onDecline}>
              Từ chối
            </Button>
          )}

          {myPlayer && (
            <Button 
              className="flex-1" 
              onClick={onRematch}
              disabled={myPlayer === 'X' ? rematchStatus.x : rematchStatus.o}
            >
              {(myPlayer === 'X' ? rematchStatus.x : rematchStatus.o) 
                ? "Đang chờ đối phương..." 
                : (myPlayer === 'X' ? rematchStatus.o : rematchStatus.x) 
                  ? "Đồng ý tái đấu" 
                  : "Tái đấu"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverDialog;
