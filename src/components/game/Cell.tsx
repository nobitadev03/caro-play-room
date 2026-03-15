import { useState } from "react";
import type { CellValue, Player } from "@/lib/gameLogic";
import XPiece from "./XPiece";
import OPiece from "./OPiece";

interface CellProps {
  value: CellValue;
  onClick: () => void;
  currentPlayer: Player;
  isWinning: boolean;
  isLastCol: boolean;
  isLastRow: boolean;
  disabled: boolean;
  isLastMove?: boolean;
}

const Cell = ({ value, onClick, currentPlayer, isWinning, isLastCol, isLastRow, disabled, isLastMove }: CellProps) => {
  const [hovered, setHovered] = useState(false);

  const winBg = isWinning
    ? value === 'X'
      ? 'bg-primary/10'
      : 'bg-secondary/10'
    : '';

  const lastMoveBg = isLastMove && !isWinning ? 'bg-foreground/5' : '';

  return (
    <div
      className={`cell ${isLastCol ? 'border-r-0' : ''} ${isLastRow ? 'border-b-0' : ''} ${winBg} ${lastMoveBg}`}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: disabled ? 'default' : 'pointer' }}
    >
      {value === 'X' && <XPiece isWinning={isWinning} />}
      {value === 'O' && <OPiece isWinning={isWinning} />}
      {!value && hovered && !disabled && (
        currentPlayer === 'X' ? <XPiece isPreview /> : <OPiece isPreview />
      )}
    </div>
  );
};

export default Cell;
