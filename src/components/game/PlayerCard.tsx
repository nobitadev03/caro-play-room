import type { Player } from "@/lib/gameLogic";

interface PlayerCardProps {
  name: string;
  player: Player;
  isActive: boolean;
  wins: number;
}

const PlayerCard = ({ name, player, isActive, wins }: PlayerCardProps) => {
  const colorClass = player === 'X' ? 'text-primary' : 'text-secondary';

  return (
    <div className="player-card flex-1 min-w-0 px-2.5 py-2 sm:p-4 gap-2 sm:gap-3" data-active={isActive}>
      <div
        className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full flex items-center justify-center font-semibold text-base sm:text-lg ${
          player === 'X' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
        } ${isActive ? 'ring-2 ring-offset-2 ' + (player === 'X' ? 'ring-primary' : 'ring-secondary') : ''}`}
      >
        {player}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs sm:text-sm text-foreground truncate">{name}</p>
        <p className="label-text truncate">{wins} thắng</p>
      </div>
      {isActive && (
        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 shrink-0 rounded-full ${player === 'X' ? 'bg-primary' : 'bg-secondary'} animate-pulse`} />
      )}
    </div>
  );
};

export default PlayerCard;
