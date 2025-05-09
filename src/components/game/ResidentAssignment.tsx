import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, ChevronDown, ChevronUp, UserCheck, AlertCircle, Users } from "lucide-react";
import type { Building, Neighbor } from "../../types/game";

type ResidentAssignmentProps = {
  neighbors: Neighbor[];
  grid: (Building | null)[];
  onAssignResident: (neighborId: number, houseIndex: number) => void;
  onRemoveResident: (neighborId: number) => void;
};

export default function ResidentAssignment({
  neighbors,
  grid,
  onAssignResident,
  onRemoveResident
}: ResidentAssignmentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedNeighbor, setSelectedNeighbor] = useState<number | null>(null);

  const availableNeighbors = neighbors.filter(n => n.unlocked && !n.hasHome);
  const housedNeighbors = neighbors.filter(n => n.unlocked && n.hasHome);
  
  const residentialBuildings = grid
    .map((building, index) => ({ building, index }))
    .filter(
      item => item.building && 
      (item.building.id === 'house' || item.building.id === 'apartment')
    );

  const getAvailableSpaces = (buildingIndex: number) => {
    const building = grid[buildingIndex];
    if (!building || (!building.residentCapacity && building.id !== 'house')) return 0;
    
    const capacity = building.residentCapacity || 1;
    const currentOccupants = building.occupants?.length || 0;
    return capacity - currentOccupants;
  };

  const isNeighborCompatibleWithBuilding = (neighbor: Neighbor, building: Building) => {
    if (neighbor.housingPreference === 'house' && building.id === 'apartment') {
      return false;
    }
    if (neighbor.housingPreference === 'apartment' && building.id === 'house') {
      return false;
    }
    return true;
  };

  const getNeighborHappinessIndicator = (neighbor: Neighbor) => {
    const happiness = neighbor.happiness || 70;
    if (happiness >= 80) return '😊';
    if (happiness >= 60) return '😐';
    if (happiness >= 40) return '😕';
    return '😢';
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <motion.div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
              <Home size={16} />
            </div>
            <div>
              <h3 className="font-medium lowercase text-gray-800">housing</h3>
              <div className="text-xs text-gray-500 lowercase">
                {housedNeighbors.length}/{neighbors.filter(n => n.unlocked).length} neighbors housed
              </div>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </motion.div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 border-t border-gray-100 bg-gray-50"
          >
            {availableNeighbors.length === 0 && residentialBuildings.length === 0 ? (
              <div className="p-3 bg-gray-100 rounded-lg mt-3 text-center text-gray-500 lowercase">
                build houses and unlock neighbors to assign residents
              </div>
            ) : residentialBuildings.length === 0 ? (
              <div className="p-3 bg-yellow-50 rounded-lg mt-3 text-sm text-yellow-700 flex items-start">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <p>You have {availableNeighbors.length} neighbors who need homes. Build houses or apartments to house them.</p>
              </div>
            ) : availableNeighbors.length === 0 ? (
              <div className="p-3 bg-emerald-50 rounded-lg mt-3 text-sm text-emerald-700 flex items-start">
                <UserCheck size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <p>All your neighbors have homes! Unlock more neighbors to fill your available housing.</p>
              </div>
            ) : null}

            {availableNeighbors.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 lowercase">neighbors needing homes</h4>
                <div className="space-y-2 mb-3">
                  {availableNeighbors.map(neighbor => (
                    <motion.div
                      key={neighbor.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedNeighbor(selectedNeighbor === neighbor.id ? null : neighbor.id)}
                      className={`flex justify-between items-center p-2 rounded-lg cursor-pointer border ${
                        selectedNeighbor === neighbor.id 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="text-2xl mr-2">{neighbor.avatar}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-700 lowercase flex items-center gap-2">
                            {neighbor.name} {getNeighborHappinessIndicator(neighbor)}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>rent: {neighbor.dailyRent} coins/day</span>
                            <span>prefers: {neighbor.housingPreference}</span>
                            {neighbor.maxNeighbors && neighbor.maxNeighbors > 1 && (
                              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                                social: max {neighbor.maxNeighbors} roommates
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        {selectedNeighbor === neighbor.id ? (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">Selected</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Select</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {residentialBuildings.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2 lowercase">available housing</h4>
                <div className="grid grid-cols-2 gap-2">
                  {residentialBuildings.map(({ building, index }) => {
                    const availableSpaces = getAvailableSpaces(index);
                    const currentOccupants = building?.occupants || [];
                    const selectedNeighborObj = selectedNeighbor ? neighbors.find(n => n.id === selectedNeighbor) : null;
                    const isCompatible = selectedNeighborObj ? isNeighborCompatibleWithBuilding(selectedNeighborObj, building!) : true;
                    
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (selectedNeighbor && availableSpaces > 0 && isCompatible) {
                            onAssignResident(selectedNeighbor, index);
                            setSelectedNeighbor(null);
                          }
                        }}
                        className={`p-2 rounded-lg border ${
                          selectedNeighbor && availableSpaces > 0 && isCompatible
                            ? 'bg-white border-emerald-300 cursor-pointer' 
                            : selectedNeighbor && !isCompatible
                            ? 'bg-red-50 border-red-200 cursor-not-allowed'
                            : 'bg-gray-50 border-gray-200 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                              style={{ backgroundColor: building?.color }}
                            >
                              <Home size={16} className="text-white" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-700 lowercase flex items-center gap-1">
                                {building?.name} #{index}
                                {currentOccupants.length > 0 && (
                                  <div className="flex -space-x-1">
                                    {currentOccupants.map(occupantId => {
                                      const occupant = neighbors.find(n => n.id === occupantId);
                                      return occupant ? (
                                        <div key={occupantId} className="w-4 h-4 text-xs">
                                          {occupant.avatar}
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Users size={10} />
                                {availableSpaces}/{building?.residentCapacity || 1} spaces
                                {selectedNeighbor && !isCompatible && (
                                  <span className="text-red-500">incompatible</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {housedNeighbors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 lowercase">housed neighbors</h4>
                <div className="space-y-2">
                  {housedNeighbors.map(neighbor => {
                    const house = neighbor.houseIndex !== undefined ? grid[neighbor.houseIndex] : null;
                    const roommates = house?.occupants?.filter(id => id !== neighbor.id).map(id => 
                      neighbors.find(n => n.id === id)
                    ).filter(Boolean) || [];
                    
                    return (
                      <div 
                        key={neighbor.id}
                        className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{neighbor.avatar}</div>
                            <div>
                              <div className="text-sm font-medium text-gray-700 lowercase flex items-center gap-2">
                                {neighbor.name} {getNeighborHappinessIndicator(neighbor)}
                              </div>
                              <div className="text-xs text-emerald-600 flex items-center gap-2">
                                <span>pays {neighbor.dailyRent} coins/day</span>
                                {roommates.length > 0 && (
                                  <span>roommates: {roommates.map(r => r?.avatar).join(' ')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-white px-2 py-1 rounded text-xs">
                              <div 
                                className="w-4 h-4 rounded-full mr-1 flex items-center justify-center"
                                style={{ backgroundColor: house?.color }}
                              >
                                <Home size={10} className="text-white" />
                              </div>
                              <span className="text-gray-600">{house?.name} #{neighbor.houseIndex}</span>
                            </div>
                            <button
                              onClick={() => onRemoveResident(neighbor.id)}
                              className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                            >
                              evict
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}