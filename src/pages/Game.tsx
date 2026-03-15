import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Board from "@/components/game/Board";
import PlayerCard from "@/components/game/PlayerCard";
import MoveHistory from "@/components/game/MoveHistory";
import GameOverDialog from "@/components/game/GameOverDialog";
import JoinRoomDialog from "@/components/game/JoinRoomDialog";
import TurnTimer from "@/components/game/TurnTimer";
import { Button } from "@/components/ui/button";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { ArrowLeft, RotateCcw, Loader2, Copy, Check } from "lucide-react";

const Game = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    room,
    gameState,
    myPlayer,
    loading,
    error,
    handleCellClick,
    handleRematch,
    handleJoin,
    handleTimeout,
  } = useMultiplayerGame(roomId!);

  const [showResult, setShowResult] = useState(false);
  const [prevMoveCount, setPrevMoveCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // Detect game over
  useEffect(() => {
    if (gameState && gameState.isGameOver && gameState.moves.length > prevMoveCount) {
      setTimeout(() => setShowResult(true), 600);
    }
    if (gameState) setPrevMoveCount(gameState.moves.length);
  }, [gameState?.isGameOver, gameState?.moves.length]);

  // Bug 1 fix: auto-show join dialog for shared-link guests
  useEffect(() => {
    if (!loading && myPlayer === null && room?.status === "waiting") {
      setShowJoinDialog(true);
    }
  }, [loading, myPlayer, room?.status]);

  const handleJoinConfirm = async (playerName: string) => {
    const ok = await handleJoin(playerName);
    if (ok) setShowJoinDialog(false);
  };

  const handleRematchAndClose = () => {
    setShowResult(false);
    handleRematch();
  };

  const handleLeave = () => navigate("/");

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !gameState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={handleLeave}>Về sảnh chờ</Button>
      </div>
    );
  }

  const playerNames = {
    X: room?.player_x_name || "Người chơi X",
    O: room?.player_o_name || "Đang chờ...",
  };

  const isWaiting = room?.status === "waiting";
  const isMyTurn = myPlayer === gameState.currentPlayer;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={roomId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-background flex flex-col"
      >
        {/* Header */}
        <header className="border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleLeave} className="w-8 h-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-sm text-foreground">{room?.name || "Phòng chơi"}</h1>
              <p className="text-xs text-muted-foreground mono-text">
                {room?.board_size}×{room?.board_size} • Nước #{gameState.moves.length}
                {myPlayer && (
                  <span className="ml-2">
                    • Bạn là <span className={myPlayer === "X" ? "text-primary" : "text-secondary"}>{myPlayer}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Timer in header */}
            {!isWaiting && myPlayer && (
              <TurnTimer
                deadline={room?.turn_deadline ?? null}
                isMyTurn={isMyTurn}
                isGameOver={gameState.isGameOver}
                onTimeout={handleTimeout}
              />
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={copyLink}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Đã sao" : "Mời bạn"}
            </Button>
            {myPlayer && (
              <Button variant="outline" size="sm" onClick={handleRematchAndClose} className="gap-2">
                <RotateCcw className="w-3.5 h-3.5" />
                Ván mới
              </Button>
            )}
          </div>
        </header>

        {/* Waiting banner */}
        {isWaiting && (
          <div className="bg-muted/50 border-b px-6 py-3 text-center">
            <p className="text-sm text-muted-foreground">
              Đang chờ đối thủ... Chia sẻ link để mời bạn bè!
            </p>
          </div>
        )}

        {/* Turn indicator */}
        {!isWaiting && !gameState.isGameOver && myPlayer && (
          <div className={`px-6 py-2 text-center text-xs font-medium border-b ${isMyTurn ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"}`}>
            {isMyTurn ? "Lượt của bạn!" : `Đang chờ ${playerNames[gameState.currentPlayer]}...`}
          </div>
        )}

        {/* Main layout */}
        <div className="flex-1 flex">
          <aside className="w-64 border-r p-4 hidden lg:flex flex-col gap-3">
            <p className="label-text mb-1">Người chơi</p>
            <PlayerCard
              name={playerNames.X}
              player="X"
              isActive={gameState.currentPlayer === "X" && !gameState.isGameOver && !isWaiting}
              wins={0}
            />
            <PlayerCard
              name={playerNames.O}
              player="O"
              isActive={gameState.currentPlayer === "O" && !gameState.isGameOver && !isWaiting}
              wins={0}
            />

            {!myPlayer && (
              <p className="text-xs text-muted-foreground text-center mt-2">Bạn đang xem trận đấu</p>
            )}

            <div className="mt-auto">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleLeave}>
                Rời phòng
              </Button>
            </div>
          </aside>

          <main className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <Board gameState={gameState} onCellClick={handleCellClick} />
          </main>

          <aside className="w-64 border-l hidden lg:flex flex-col">
            <MoveHistory moves={gameState.moves} />
          </aside>
        </div>

        {/* Mobile player info */}
        <div className="lg:hidden border-t p-3 flex gap-2">
          <PlayerCard
            name={playerNames.X}
            player="X"
            isActive={gameState.currentPlayer === "X" && !gameState.isGameOver && !isWaiting}
            wins={0}
          />
          <PlayerCard
            name={playerNames.O}
            player="O"
            isActive={gameState.currentPlayer === "O" && !gameState.isGameOver && !isWaiting}
            wins={0}
          />
        </div>

        <GameOverDialog
          open={showResult}
          winner={gameState.winner}
          playerNames={playerNames}
          onRematch={handleRematchAndClose}
          onLeave={handleLeave}
        />

        {/* Bug 1 fix: join dialog for guests arriving via shared link */}
        <JoinRoomDialog
          open={showJoinDialog}
          onOpenChange={setShowJoinDialog}
          roomName={room?.name || ""}
          onJoin={handleJoinConfirm}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default Game;
