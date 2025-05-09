import React from 'react';
import { Lock } from 'lucide-react';
import type { Neighbor } from '../../types/game';

interface NeighborListProps {
  neighbors: Neighbor[];
  onNeighborClick: (neighbor: Neighbor) => void;
}

export default function NeighborList({ neighbors, onNeighborClick }: NeighborListProps) {
  return (
    <div className="bg-navy-900 rounded-xl p-3">
      <div className="space-y-2">
        {neighbors.map((neighbor) => (
          <div 
            key={neighbor.id}
            className="bg-white rounded-lg p-3 cursor-pointer transition-colors hover:bg-gray-50"
            onClick={() => onNeighborClick(neighbor)}
          >
            {neighbor.unlocked ? (
              <div className="flex items-center">
                <div className="text-2xl mr-3">{neighbor.avatar}</div>
                <div>
                  <div className="font-medium text-gray-900">{neighbor.name}</div>
                  <div className="text-sm text-gray-600">{neighbor.trait}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  <Lock size={14} className="text-gray-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">locked neighbor</div>
                  <div className="text-sm text-gray-600">
                    {neighbor.unlockCondition?.description}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}