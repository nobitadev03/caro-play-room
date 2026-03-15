import type { Move } from "@/lib/gameLogic";
import { getColLabel } from "@/lib/gameLogic";
import { useEffect, useRef } from "react";

interface MoveHistoryProps {
  moves: Move[];
}

const MoveHistory = ({ moves }: MoveHistoryProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [moves.length]);

  return (
    <div className="flex flex-col h-full">
      <h3 className="label-text px-4 py-3 border-b">Lịch sử nước đi</h3>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {moves.length === 0 && (
          <p className="text-muted-foreground text-sm px-2 py-4 text-center">Chưa có nước đi nào</p>
        )}
        {moves.map((move) => (
          <div
            key={move.moveNumber}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm hover:bg-muted/50 transition-colors"
          >
            <span className="mono-text text-muted-foreground w-6 text-right text-xs">{move.moveNumber}.</span>
            <span className={`font-semibold ${move.player === 'X' ? 'text-primary' : 'text-secondary'}`}>
              {move.player}
            </span>
            <span className="mono-text text-foreground text-xs">
              {getColLabel(move.col)}{move.row + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoveHistory;
