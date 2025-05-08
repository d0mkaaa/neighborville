import type { Neighbor } from "../../types/game";

type NeighborCardProps = {
  neighbor: Neighbor;
  onClick: (neighbor: Neighbor) => void;
};

export default function NeighborCard({ neighbor, onClick }: NeighborCardProps) {
  return (
    <div
      className="neighbor-card"
      onClick={() => onClick(neighbor)}
    >
      <div className="text-2xl mr-3">{neighbor.avatar}</div>
      <div>
        <div className="font-medium text-sm font-game text-indigo-800">{neighbor.name}</div>
        <div className="text-xs text-gray-500 font-game">{neighbor.trait}</div>
      </div>
    </div>
  );
}