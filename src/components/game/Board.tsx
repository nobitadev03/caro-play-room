import type { GameState } from "@/lib/gameLogic";
import { getColLabel } from "@/lib/gameLogic";
import Cell from "./Cell";

interface BoardProps {
  gameState: GameState;
  onCellClick: (row: number, col: number) => void;
}

const Board = ({ gameState, onCellClick }: BoardProps) => {
  const { board, currentPlayer, winningCells, isGameOver, boardSize } = gameState;

  const isWinningCell = (r: number, c: number) =>
    winningCells.some(([wr, wc]) => wr === r && wc === c);

  return (
    <div className="board-container inline-block relative">
      {/* Column labels */}
      <div className="flex">
        <div className="w-7" />
        {Array.from({ length: boardSize }, (_, i) => (
          <div key={i} className="w-10 text-center label-text py-1.5">
            {getColLabel(i)}
          </div>
        ))}
      </div>

      {/* Board rows */}
      {board.map((row, r) => (
        <div key={r} className="flex">
          {/* Row label */}
          <div className="w-7 flex items-center justify-center label-text">
            {r + 1}
          </div>
          {row.map((cell, c) => (
            <Cell
              key={`${r}-${c}`}
              value={cell}
              onClick={() => onCellClick(r, c)}
              currentPlayer={currentPlayer}
              isWinning={isWinningCell(r, c)}
              isLastCol={c === boardSize - 1}
              isLastRow={r === boardSize - 1}
              disabled={isGameOver}
            />
          ))}
        </div>
      ))}

      {/* Winning line strikethrough */}
      {isGameOver && winningCells.length >= 5 && (
        <svg
          className="absolute pointer-events-none"
          style={{ top: '28px', left: '28px', width: boardSize * 40, height: boardSize * 40 }}
        >
          <line
            x1={winningCells[0][1] * 40 + 20}
            y1={winningCells[0][0] * 40 + 20}
            x2={winningCells[winningCells.length - 1][1] * 40 + 20}
            y2={winningCells[winningCells.length - 1][0] * 40 + 20}
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className={currentPlayer === 'X' ? 'text-primary' : 'text-secondary'}
          />
        </svg>
      )}
    </div>
  );
};

export default Board;
