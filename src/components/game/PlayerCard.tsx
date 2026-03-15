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
    <div className="player-card" data-active={isActive}>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg ${
          player === 'X' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
        } ${isActive ? 'ring-2 ring-offset-2 ' + (player === 'X' ? 'ring-primary' : 'ring-secondary') : ''}`}
      >
        {player}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{name}</p>
        <p className="label-text">{wins} thắng</p>
      </div>
      {isActive && (
        <div className={`w-2 h-2 rounded-full ${player === 'X' ? 'bg-primary' : 'bg-secondary'} animate-pulse`} />
      )}
    </div>
  );
};

export default PlayerCard;
