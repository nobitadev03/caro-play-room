import { useState, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Board from "@/components/game/Board";
import PlayerCard from "@/components/game/PlayerCard";
import MoveHistory from "@/components/game/MoveHistory";
import GameOverDialog from "@/components/game/GameOverDialog";
import { Button } from "@/components/ui/button";
import { createGameState, makeMove } from "@/lib/gameLogic";
import { ArrowLeft, RotateCcw } from "lucide-react";

const Game = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { roomName, boardSize, playerName } = (location.state as any) || {
    roomName: "Phòng chơi",
    boardSize: 15,
    playerName: "Người chơi 1",
  };

  const player2Name = "Người chơi 2";
  const playerNames = { X: playerName, O: player2Name };

  const [gameState, setGameState] = useState(() => createGameState(boardSize));
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [showResult, setShowResult] = useState(false);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      setGameState((prev) => {
        const next = makeMove(prev, row, col);
        if (next.isGameOver && !prev.isGameOver) {
          setScores((s) => ({
            ...s,
            [next.winner!]: s[next.winner!] + 1,
          }));
          setTimeout(() => setShowResult(true), 600);
        }
        return next;
      });
    },
    []
  );

  const handleRematch = () => {
    setShowResult(false);
    setGameState(createGameState(boardSize));
  };

  const handleLeave = () => {
    navigate("/");
  };

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
              <h1 className="font-semibold text-sm text-foreground">{roomName}</h1>
              <p className="text-xs text-muted-foreground mono-text">
                {boardSize}×{boardSize} • Nước #{gameState.moves.length}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRematch} className="gap-2">
            <RotateCcw className="w-3.5 h-3.5" />
            Ván mới
          </Button>
        </header>

        {/* Main layout */}
        <div className="flex-1 flex">
          {/* Left sidebar */}
          <aside className="w-64 border-r p-4 hidden lg:flex flex-col gap-3">
            <p className="label-text mb-1">Người chơi</p>
            <PlayerCard
              name={playerNames.X}
              player="X"
              isActive={gameState.currentPlayer === "X" && !gameState.isGameOver}
              wins={scores.X}
            />
            <PlayerCard
              name={playerNames.O}
              player="O"
              isActive={gameState.currentPlayer === "O" && !gameState.isGameOver}
              wins={scores.O}
            />

            <div className="mt-auto">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleLeave}>
                Rời phòng
              </Button>
            </div>
          </aside>

          {/* Center - Board */}
          <main className="flex-1 flex items-center justify-center p-4 overflow-auto">
            <Board gameState={gameState} onCellClick={handleCellClick} />
          </main>

          {/* Right sidebar - Move history */}
          <aside className="w-64 border-l hidden lg:flex flex-col">
            <MoveHistory moves={gameState.moves} />
          </aside>
        </div>

        {/* Mobile player info */}
        <div className="lg:hidden border-t p-3 flex gap-2">
          <PlayerCard
            name={playerNames.X}
            player="X"
            isActive={gameState.currentPlayer === "X" && !gameState.isGameOver}
            wins={scores.X}
          />
          <PlayerCard
            name={playerNames.O}
            player="O"
            isActive={gameState.currentPlayer === "O" && !gameState.isGameOver}
            wins={scores.O}
          />
        </div>

        <GameOverDialog
          open={showResult}
          winner={gameState.winner}
          playerNames={playerNames}
          onRematch={handleRematch}
          onLeave={handleLeave}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default Game;
