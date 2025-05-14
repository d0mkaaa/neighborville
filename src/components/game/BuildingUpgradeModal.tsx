import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpCircle, Coins, Home, Users, Heart, Zap, AlertTriangle } from "lucide-react";
import type { Building } from "../../types/game";

type UpgradeOption = {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: {
    happiness?: number;
    income?: number;
    energy?: number;
    residents?: number;
    special?: string;
  };
  icon: React.ReactNode;
}

type BuildingUpgradeModalProps = {
  building: Building;
  onClose: () => void;
  onUpgrade: (building: Building, upgrades: string[]) => void;
  playerCoins: number;
};

export default function BuildingUpgradeModal({ building, onClose, onUpgrade, playerCoins }: BuildingUpgradeModalProps) {
  const [selectedUpgrade, setSelectedUpgrade] = useState<string | null>(null);
  const [confirmingUpgrade, setConfirmingUpgrade] = useState(false);
  
  const upgradeOptions: UpgradeOption[] = [
    {
      id: "eco_friendly",
      name: "Eco-Friendly Materials",
      description: "Use sustainable materials to improve happiness bonus and reduce energy usage",
      cost: Math.round(building.cost * 0.3),
      effect: {
        happiness: 5,
        energy: -2
      },
      icon: <Heart className="text-green-500" size={20} />
    },
    {
      id: "modern_design",
      name: "Modern Design",
      description: "Update to a sleek modern design that increases income",
      cost: Math.round(building.cost * 0.4),
      effect: {
        income: Math.round(building.income * 0.25)
      },
      icon: <Home className="text-blue-500" size={20} />
    },
    
    ...(building.type === 'residential' ? [
      {
        id: "extra_rooms",
        name: "Extra Rooms",
        description: "Add more living space to increase capacity",
        cost: Math.round((building.cost || 0) * 0.5),
        effect: {
          residents: Math.max(1, Math.floor(Array.isArray(building.residents) ? 2 : (building.residents || 0) * 0.5))
        },
        icon: <Users className="text-purple-500" size={20} />
      }
    ] : []),
    
    ...(building.type === 'entertainment' ? [
      {
        id: "special_events",
        name: "Special Events",
        description: "Regular events that boost happiness and income",
        cost: Math.round(building.cost * 0.6),
        effect: {
          happiness: 8,
          income: Math.round(building.income * 0.2)
        },
        icon: <Zap className="text-yellow-500" size={20} />
      }
    ] : []),
    
    ...(building.type === 'commercial' ? [
      {
        id: "expanded_inventory",
        name: "Expanded Inventory",
        description: "Increase product offerings to boost income significantly",
        cost: Math.round(building.cost * 0.7),
        effect: {
          income: Math.round(building.income * 0.35)
        },
        icon: <Coins className="text-amber-500" size={20} />
      }
    ] : [])
  ].filter(upgrade => !building.upgrades?.includes(upgrade.id));
  
  const handleUpgrade = () => {
    if (!selectedUpgrade) return;
    
    const upgrade = upgradeOptions.find(opt => opt.id === selectedUpgrade);
    if (!upgrade) return;
    
    const upgradedBuilding = { 
      ...building,
      upgrades: [...(building.upgrades || []), upgrade.id],
      happiness: building.happiness + (upgrade.effect.happiness || 0),
      income: building.income + (upgrade.effect.income || 0),
      energy: (building.energy || 0) + (upgrade.effect.energy || 0),
      residents: Array.isArray(building.residents) ? building.residents : ((building.residents || 0) + (upgrade.effect.residents || 0))
    };
    
    onUpgrade(upgradedBuilding, [...(building.upgrades || []), upgrade.id]);
    setConfirmingUpgrade(false);
    onClose();
  };
  
  const getEffectLabel = (effect: { [key: string]: number | string | undefined }) => {
    const labels = [];
    
    if (effect.happiness) labels.push(`+${effect.happiness} happiness`);
    if (effect.income) labels.push(`+${effect.income} coins/day`);
    if (effect.energy && typeof effect.energy === 'number' && effect.energy < 0) labels.push(`${effect.energy} energy usage`);
    if (effect.energy && typeof effect.energy === 'number' && effect.energy > 0) labels.push(`+${effect.energy} energy production`);
    if (effect.residents) labels.push(`+${effect.residents} residents`);
    if (effect.special) labels.push(effect.special);
    
    return labels.join(", ");
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium">Upgrade {building.name}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <AnimatePresence mode="wait">
            {!confirmingUpgrade ? (
              <motion.div
                key="options"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Select an upgrade</h3>
                  <p className="text-sm text-gray-600">
                    Available coins: <span className="font-semibold">{playerCoins}</span>
                  </p>
                </div>
                
                <div className="space-y-3 mb-6">
                  {upgradeOptions.length === 0 ? (
                    <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
                      <p>No upgrades available for this building</p>
                    </div>
                  ) : (
                    upgradeOptions.map((upgrade) => (
                      <motion.div
                        key={upgrade.id}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedUpgrade === upgrade.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        } ${
                          playerCoins < upgrade.cost ? 'opacity-50' : ''
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => playerCoins >= upgrade.cost && setSelectedUpgrade(upgrade.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-gray-100 p-2">
                            {upgrade.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-gray-800">{upgrade.name}</h4>
                              <div className="text-sm font-medium flex items-center gap-1">
                                <Coins size={14} className="text-amber-500" /> 
                                {upgrade.cost}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{upgrade.description}</p>
                            <div className="mt-2 text-xs text-blue-600 font-medium">
                              {getEffectLabel(upgrade.effect)}
                            </div>
                            
                            {playerCoins < upgrade.cost && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
                                <AlertTriangle size={12} />
                                <span>Insufficient funds</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setConfirmingUpgrade(true)}
                    disabled={!selectedUpgrade}
                    className={`px-4 py-2 rounded-lg ${
                      !selectedUpgrade
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <ArrowUpCircle size={40} className="text-blue-600" />
                </div>
                
                {selectedUpgrade && (
                  <>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                      Upgrade to {upgradeOptions.find(u => u.id === selectedUpgrade)?.name}?
                    </h3>
                    <p className="text-gray-600 mb-3">
                      This will cost {upgradeOptions.find(u => u.id === selectedUpgrade)?.cost} coins
                    </p>
                    <p className="text-sm text-gray-600 mb-6">
                      {upgradeOptions.find(u => u.id === selectedUpgrade)?.description}
                    </p>
                  </>
                )}
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmingUpgrade(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    Go Back
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUpgrade}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
                  >
                    Confirm Upgrade
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
