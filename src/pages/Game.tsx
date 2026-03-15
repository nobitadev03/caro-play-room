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
import { ArrowLeft, RotateCcw, Loader2, Copy, Check, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import useSound from "use-sound";
import confetti from "canvas-confetti";
import { PLAY_SOUND_URL, WIN_SOUND_URL } from "@/lib/sounds";
import ChatBox from "@/components/game/ChatBox";

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
  const [showMobileChat, setShowMobileChat] = useState(false);

  const [playMoveSound] = useSound(PLAY_SOUND_URL, { volume: 0.5 });
  const [playWinSound] = useSound(WIN_SOUND_URL, { volume: 0.5 });

  // Detect game over and rematch resets
  useEffect(() => {
    if (gameState && gameState.isGameOver && gameState.moves.length > prevMoveCount) {
      setTimeout(() => {
        setShowResult(true);
        if (gameState.winner === myPlayer || gameState.winner) {
          playWinSound();
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: gameState.winner === 'X' ? ['#2563eb', '#60a5fa'] : ['#e11d48', '#fb7185']
          });
        }
      }, 600);
    }
    // If the game is restarted from a rematch, hide the dialog automatically
    if (gameState && !gameState.isGameOver && showResult) {
      setShowResult(false);
    }
    
    // Play move sound if moves increased
    if (gameState && gameState.moves.length > prevMoveCount && prevMoveCount > 0) {
      playMoveSound();
    }
    
    if (gameState) setPrevMoveCount(gameState.moves.length);
  }, [gameState?.isGameOver, gameState?.moves.length, showResult, playMoveSound, playWinSound, gameState?.winner, myPlayer]);

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
    // Only call handleRematch to toggle the ready state.
    // The dialog will close automatically when the Postgres event resets the game.
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
        <header className="border-b px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={handleLeave} className="w-8 h-8 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm text-foreground truncate">{room?.name || "Phòng chơi"}</h1>
              <p className="text-xs text-muted-foreground mono-text truncate">
                {room?.board_size}×{room?.board_size} • #{gameState.moves.length}
                {myPlayer && (
                  <span className="ml-1 sm:ml-2">
                    <span className="hidden sm:inline">• Bạn là </span>
                    <span className={myPlayer === "X" ? "text-primary" : "text-secondary"}>{myPlayer}</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="lg:hidden w-8 h-8 rounded-full" onClick={() => setShowMobileChat(!showMobileChat)}>
              <MessageSquare className="w-4 h-4" />
            </Button>
            {/* Timer in header */}
            {!isWaiting && myPlayer && (
              <TurnTimer
                deadline={room?.turn_deadline ?? null}
                isMyTurn={isMyTurn}
                isGameOver={gameState.isGameOver}
                onTimeout={handleTimeout}
              />
            )}
            <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 px-2 sm:px-3" onClick={copyLink}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? "Đã sao" : "Mời bạn"}</span>
            </Button>
            {myPlayer && (
              <Button variant="outline" size="sm" onClick={handleRematchAndClose} className="gap-1.5 sm:gap-2 px-2 sm:px-3">
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ván mới</span>
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

          <main className="flex-1 overflow-auto relative bg-muted/20">
            <div className="min-w-full min-h-full flex items-center justify-center p-4 sm:p-8 w-max h-max">
              <Board gameState={gameState} onCellClick={handleCellClick} />
            </div>
          </main>

          <aside className="w-64 md:w-80 border-l hidden lg:flex flex-col gap-4 p-4">
            <div className="flex-1 min-h-0 border rounded-xl overflow-hidden shadow-sm bg-card">
              <MoveHistory moves={gameState.moves} />
            </div>
            <div className="flex-1 min-h-0 h-64 border rounded-xl shadow-sm overflow-hidden bg-card">
              <ChatBox roomId={roomId!} myPlayerName={myPlayer === 'X' ? playerNames.X : myPlayer === 'O' ? playerNames.O : "Khán giả"} />
            </div>
          </aside>
        </div>
        
        {/* Mobile Chat View Overlay */}
        <AnimatePresence>
          {showMobileChat && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="lg:hidden absolute bottom-[72px] left-0 right-0 h-80 z-20 px-2"
            >
              <div className="h-full rounded-t-xl overflow-hidden shadow-xl border">
                <ChatBox roomId={roomId!} myPlayerName={myPlayer === 'X' ? playerNames.X : myPlayer === 'O' ? playerNames.O : "Khán giả"} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile player info */}
        <div className="lg:hidden border-t p-2 sm:p-3 flex gap-2">
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
          myPlayer={myPlayer}
          rematchStatus={{ 
            x: room?.rematch_x_ready || false, 
            o: room?.rematch_o_ready || false 
          }}
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
