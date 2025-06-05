import GameGrid from './GameGrid';
import UtilityGrid from './UtilityGrid';
import EnergyUsagePanel from './EnergyUsagePanel';
import BillsPanel from './BillsPanel';
import PlotExpansion from './PlotExpansion';
import ResidentAssignment from './ResidentAssignment';
import type { Building, PowerGrid, WaterGrid, Bill, Neighbor } from '../../types/game';

type GameMainContentProps = {
  grid: (Building | null)[];
  gridSize: number;
  selectedBuilding: Building | null;
  selectedTile: number | null;  powerGrid: PowerGrid;
  waterGrid: WaterGrid;
  bills: Bill[];
  neighbors: Neighbor[];
  coins: number;
  day: number;
  level: number;
  energyRate: number;
  totalEnergyUsage: number;
  daysUntilBill: number;
  onTileClick: (index: number) => void;
  onDeleteBuilding: (index: number) => void;
  onBuildingManage: (building: Building, index: number) => void;
  onConnectUtility: (fromIndex: number, toIndex: number, utilityType: 'power' | 'water') => void;
  onPayBill: (billId: string) => void;
  onExpand: (newSize: number, cost: number) => void;
  onAssignResident: (neighborId: number, houseIndex: number) => void;
  onRemoveResident: (neighborId: number) => void;
  activeTab: string;
};

export default function GameMainContent({
  grid,
  gridSize,
  selectedBuilding,
  selectedTile,
  powerGrid,
  waterGrid,
  bills,
  neighbors,
  coins,
  day,
  level,
  energyRate,
  totalEnergyUsage,
  daysUntilBill,
  onTileClick,
  onDeleteBuilding,
  onBuildingManage,
  onConnectUtility,
  onPayBill,
  onExpand,
  onAssignResident,
  onRemoveResident,
  activeTab
}: GameMainContentProps) {
  return (
    <div className="container mx-auto px-4 py-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-4">
          {activeTab === 'utilities' && (
            <div className="space-y-4">
              <UtilityGrid
                grid={grid}
                powerGrid={powerGrid}
                waterGrid={waterGrid}
                onConnectUtility={onConnectUtility}
                gridSize={gridSize}
              />
              
              <EnergyUsagePanel
                grid={grid}
                energyRate={energyRate}
                totalEnergyUsage={totalEnergyUsage}
                daysUntilBill={daysUntilBill}
              />
              
              <BillsPanel
                bills={bills}
                onPayBill={onPayBill}
                coins={coins}
                currentDay={day}
              />
              
              <PlotExpansion
                currentSize={gridSize}
                maxSize={64}
                coins={coins}
                playerLevel={level}
                onExpand={onExpand}
              />
            </div>
          )}

          {activeTab === 'residents' && (
            <ResidentAssignment
              neighbors={neighbors}
              grid={grid}
              onAssignResident={onAssignResident}
              onRemoveResident={onRemoveResident}
            />
          )}
        </div>
        
        <div className="col-span-9">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4">
            <GameGrid 
              grid={grid}
              gridSize={gridSize}
              maxSize={64}
              selectedBuilding={selectedBuilding}
              selectedTile={selectedTile}
              onTileClick={onTileClick}
              onDeleteBuilding={onDeleteBuilding}
              onBuildingManage={onBuildingManage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}