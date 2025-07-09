import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Home, User, Plus, Minus, DollarSign, Zap, TrendingUp, AlertTriangle, Move, Trash2, ArrowUp, Heart, Coins, UserPlus, Users,
  Wrench, Shield, Sparkles, ThumbsUp, ThumbsDown, MessageCircle, BarChart3, Settings, Activity, 
  Droplets, Leaf, Sun, CloudRain, Star, Award, Target, Clock, Flame, Lightbulb, Building2
} from "lucide-react";
import type { Building, Neighbor } from "../../types/game";
import BuildingUpgradesModal from './BuildingUpgradesModal';
import ResidentAssignment from "./ResidentAssignment";

type BuildingInfoModalProps = {
  building: Building;
  gridIndex: number;
  neighbors: Neighbor[];
  onClose: () => void;
  onAssignResident: (neighborId: number, gridIndex: number) => void;
  onRemoveResident: (neighborId: number) => void;
  onCollectIncome: () => void;
  onUpgradeBuilding: (buildingId: string, gridIndex: number, upgradeId: string) => void;
  onSellBuilding: (gridIndex: number) => void;
  onMoveBuilding: (gridIndex: number) => void;
  grid: (Building | null)[];
  currentDay?: number;
  playerCoins?: number;
  weather?: string;
  timeOfDay?: string;
};

interface EnhancedBuilding extends Building {
  value?: number;
  lastIncomeCollection?: number;
  maintenanceCost?: number;
  unlockRequirement?: string;
  description?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  lastMaintenance?: number;
  socialRating?: number;
  environmentalImpact?: number;
  efficiency?: number;
  upgradeLevel?: number;
  maintenanceHistory?: Array<{
    day: number;
    type: string;
    cost: number;
    impact: string;
  }>;
}

interface ResidentFeedback {
  id: string;
  residentName: string;
  type: 'complaint' | 'praise' | 'suggestion' | 'concern';
  message: string;
  timestamp: number;
  rating: number;
  category: 'maintenance' | 'comfort' | 'amenities' | 'location' | 'management';
}

interface BuildingAnalytics {
  weeklyIncome: number[];
  occupancyRate: number;
  satisfactionTrend: number[];
  maintenanceCosts: number[];
  efficiencyScore: number;
  environmentalRating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export default function BuildingInfoModal({ 
  building, 
  gridIndex, 
  neighbors,
  onClose, 
  onAssignResident,
  onRemoveResident,
  onCollectIncome,
  onUpgradeBuilding,
  onSellBuilding,
  onMoveBuilding,
  grid,
  currentDay = 1,
  playerCoins = 0,
  weather = 'sunny',
  timeOfDay = 'day'
}: BuildingInfoModalProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'management' | 'residents' | 'analytics' | 'social'>('overview');
  const [showUpgradesModal, setShowUpgradesModal] = useState(false);
  const [maintenanceAction, setMaintenanceAction] = useState<string | null>(null);
  const [residentFeedback, setResidentFeedback] = useState<ResidentFeedback[]>([]);
  
  const isHouse = building.id === 'house' || building.id === 'apartment';
  const occupants = building.occupants || [];
  const hasResidents = occupants.length > 0;
  
  const enhancedBuilding = building as EnhancedBuilding;
  
  const lastCollectionTime = enhancedBuilding.lastIncomeCollection || 0;
  const timeSinceCollection = Date.now() - lastCollectionTime;
  const hoursSinceCollection = timeSinceCollection / (1000 * 60 * 60);
  const incomeReady = hoursSinceCollection >= 1;

  const getBuildingCondition = (): EnhancedBuilding['condition'] => {
    const daysSinceMaintenance = currentDay - (enhancedBuilding.lastMaintenance || 0);
    if (daysSinceMaintenance < 7) return 'excellent';
    if (daysSinceMaintenance < 14) return 'good';
    if (daysSinceMaintenance < 30) return 'fair';
    if (daysSinceMaintenance < 60) return 'poor';
    return 'critical';
  };

  const getEfficiencyScore = (): number => {
    const condition = getBuildingCondition();
    const conditionMultipliers = { excellent: 1.0, good: 0.9, fair: 0.75, poor: 0.6, critical: 0.4 };
    const baseEfficiency = building.income ? 0.8 : 0.7;
    const weatherBonus = weather === 'sunny' ? 0.1 : weather === 'rainy' ? -0.05 : 0;
    const occupancyBonus = hasResidents ? 0.1 : 0;
    return Math.min(1.0, (baseEfficiency + weatherBonus + occupancyBonus) * conditionMultipliers[condition]);
  };

  const getSocialRating = (): number => {
    const baseRating = hasResidents ? 7.5 : 6.0;
    const conditionImpact = { excellent: 1.5, good: 0.5, fair: 0, poor: -1, critical: -2 }[getBuildingCondition()];
    const locationBonus = building.touristAttraction ? 1 : building.culturalValue ? 0.5 : 0;
    return Math.max(1, Math.min(10, baseRating + conditionImpact + locationBonus));
  };

  const getEnvironmentalRating = (): BuildingAnalytics['environmentalRating'] => {
    const ecoPoints = (building.ecoFriendly ? 3 : 0) + (building.wasteReduction ? 2 : 0) + (building.energyUsage < 5 ? 2 : 0);
    if (ecoPoints >= 6) return 'A+';
    if (ecoPoints >= 5) return 'A';
    if (ecoPoints >= 3) return 'B';
    if (ecoPoints >= 2) return 'C';
    if (ecoPoints >= 1) return 'D';
    return 'F';
  };

  const generateResidentFeedback = (): ResidentFeedback[] => {
    if (!hasResidents) return [];
    
    const feedbackTemplates = [
      { type: 'praise', messages: ['Love living here! Great management.', 'This place feels like home.', 'Very happy with the amenities.'], category: 'management' },
      { type: 'complaint', messages: ['Could use better maintenance.', 'Heating system needs work.', 'Noise from neighbors is an issue.'], category: 'maintenance' },
      { type: 'suggestion', messages: ['A gym would be nice!', 'More parking spaces needed.', 'Community garden idea?'], category: 'amenities' },
      { type: 'concern', messages: ['Safety lighting could be improved.', 'Elevator is slow.', 'Need better recycling options.'], category: 'comfort' }
    ];

    return occupants.slice(0, 3).map((residentId, index) => {
      const resident = neighbors.find(n => n.id === residentId);
      const template = feedbackTemplates[index % feedbackTemplates.length];
      const message = template.messages[Math.floor(Math.random() * template.messages.length)];
      
      return {
        id: `feedback-${residentId}-${index}`,
        residentName: resident?.name || `Resident ${residentId}`,
        type: template.type as ResidentFeedback['type'],
        message,
        timestamp: currentDay - Math.floor(Math.random() * 7),
        rating: Math.floor(Math.random() * 3) + (template.type === 'praise' ? 7 : template.type === 'complaint' ? 3 : 5),
        category: template.category as ResidentFeedback['category']
      };
    });
  };

  const getMaintenanceOptions = () => [
    {
      id: 'basic_repair',
      name: 'Basic Repairs',
      description: 'Fix minor issues and restore building condition',
      cost: Math.floor(building.cost * 0.1),
      effect: 'Improves condition by 1-2 levels',
      available: getBuildingCondition() !== 'excellent',
      icon: <Wrench size={16} />
    },
    {
      id: 'deep_clean',
      name: 'Deep Cleaning',
      description: 'Professional cleaning service',
      cost: Math.floor(building.cost * 0.05),
      effect: 'Increases resident satisfaction, improves efficiency',
      available: true,
      icon: <Sparkles size={16} />
    },
    {
      id: 'security_upgrade',
      name: 'Security Upgrade',
      description: 'Install modern security systems',
      cost: Math.floor(building.cost * 0.15),
      effect: 'Increases property value and resident safety',
      available: playerCoins >= Math.floor(building.cost * 0.15),
      icon: <Shield size={16} />
    },
    {
      id: 'eco_retrofit',
      name: 'Eco Retrofit',
      description: 'Install energy-efficient systems',
      cost: Math.floor(building.cost * 0.2),
      effect: 'Reduces energy costs, improves environmental rating',
      available: !building.ecoFriendly && playerCoins >= Math.floor(building.cost * 0.2),
      icon: <Leaf size={16} />
    }
  ];

  useEffect(() => {
    setResidentFeedback(generateResidentFeedback());
  }, [hasResidents, currentDay]);

  const handleMaintenance = (actionId: string) => {
    const action = getMaintenanceOptions().find(opt => opt.id === actionId);
    if (action && action.available) {
      setMaintenanceAction(actionId);
      setTimeout(() => {
        setMaintenanceAction(null);
      }, 2000);
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  useEffect(() => {
    if (isHouse && !hasResidents) {
      setSelectedTab('residents');
    }
  }, [isHouse, hasResidents]);

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        onClick={onClose}
      ></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl z-40 max-h-[85vh] overflow-auto w-full max-w-lg"
      >
        <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-2 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
              style={{ backgroundColor: building.color }}
            >
              <Home size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 lowercase">{building.name}</h2>
              <p className="text-sm text-gray-500 lowercase">#{gridIndex}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="px-4 pt-2">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              className={`px-3 py-2 text-sm whitespace-nowrap ${
                selectedTab === 'overview' 
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                  : 'text-gray-600'
              }`}
              onClick={() => setSelectedTab('overview')}
            >
              overview
            </button>
            <button
              className={`px-3 py-2 text-sm whitespace-nowrap ${
                selectedTab === 'management' 
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                  : 'text-gray-600'
              }`}
              onClick={() => setSelectedTab('management')}
            >
              maintenance
            </button>
            <button
              className={`px-3 py-2 text-sm whitespace-nowrap ${
                selectedTab === 'analytics' 
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                  : 'text-gray-600'
              }`}
              onClick={() => setSelectedTab('analytics')}
            >
              analytics
            </button>
            {hasResidents && (
              <button
                className={`px-3 py-2 text-sm whitespace-nowrap flex items-center ${
                  selectedTab === 'social' 
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                    : 'text-gray-600'
                }`}
                onClick={() => setSelectedTab('social')}
              >
                social
                <span className="ml-1 bg-emerald-100 text-emerald-600 text-xs px-1.5 rounded-full">
                  {residentFeedback.length}
                </span>
              </button>
            )}
            {isHouse && (
              <button
                className={`px-3 py-2 text-sm whitespace-nowrap flex items-center ${
                  selectedTab === 'residents' 
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                    : 'text-gray-600'
                }`}
                onClick={() => setSelectedTab('residents')}
              >
                residents
                {hasResidents && (
                  <span className="ml-1 bg-emerald-100 text-emerald-600 text-xs px-1.5 rounded-full">
                    {occupants.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="p-4">
          {selectedTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Building2 size={16} />
                    Building Status
                  </h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(getBuildingCondition())}`}>
                    {getBuildingCondition()}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className={`text-lg font-bold ${getEfficiencyColor(getEfficiencyScore())}`}>
                      {Math.round(getEfficiencyScore() * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">efficiency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600 flex items-center justify-center gap-1">
                      {getSocialRating().toFixed(1)}
                      <Star size={14} className="text-yellow-500" />
                    </div>
                    <div className="text-xs text-gray-500">social rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {getEnvironmentalRating()}
                    </div>
                    <div className="text-xs text-gray-500">eco rating</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 lowercase mb-1 flex items-center">
                    <Coins size={12} className="mr-1" /> Value
                  </div>
                  <div className="font-medium text-gray-800">{enhancedBuilding.value || building.cost || 100}c</div>
                </div>
                
                {building.income > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 lowercase mb-1 flex items-center">
                      <DollarSign size={12} className="mr-1" /> Daily Income
                    </div>
                    <div className="font-medium text-gray-800">
                      {Math.round(building.income * getEfficiencyScore())}c/day
                      {getEfficiencyScore() < 1 && (
                        <span className="text-xs text-orange-500 ml-1">
                          ({building.income}c base)
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 lowercase mb-1 flex items-center">
                    <Zap size={12} className="mr-1" /> Energy Use
                  </div>
                  <div className="font-medium text-gray-800">{building.energyUsage}u/day</div>
                </div>
                
                {hasResidents && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 lowercase mb-1 flex items-center">
                      <Users size={12} className="mr-1" /> Occupancy
                    </div>
                    <div className="font-medium text-gray-800">
                      {occupants.length}/{building.residentCapacity || 1}
                    </div>
                  </div>
                )}

              </div>
              
              <div className="p-3 rounded-lg border border-gray-200">
                <h3 className="font-medium text-sm text-gray-700 mb-2 lowercase">Building Details</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-500">Energy usage:</span>
                    <span className="ml-auto">{building.energyUsage} units/day</span>
                  </div>
                  

                  
                  {building.ecoFriendly && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Eco-friendly:</span>
                      <span className="ml-auto text-green-600">✓ Yes</span>
                    </div>
                  )}
                  
                  {building.wasteReduction && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Waste reduction:</span>
                      <span className="ml-auto text-green-600">-{building.wasteReduction}%</span>
                    </div>
                  )}
                  
                  {building.jobCapacity && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Job capacity:</span>
                      <span className="ml-auto">{building.jobCapacity} jobs</span>
                    </div>
                  )}
                  
                  {building.culturalValue && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Cultural value:</span>
                      <span className="ml-auto text-purple-600">+{building.culturalValue}</span>
                    </div>
                  )}
                  
                  {building.entertainmentValue && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Entertainment value:</span>
                      <span className="ml-auto text-blue-600">+{building.entertainmentValue}</span>
                    </div>
                  )}
                  
                  {building.touristAttraction && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Tourist attraction:</span>
                      <span className="ml-auto text-orange-600">✓ Yes</span>
                    </div>
                  )}
                  
                  {enhancedBuilding.maintenanceCost && enhancedBuilding.maintenanceCost > 0 && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Maintenance:</span>
                      <span className="ml-auto">{enhancedBuilding.maintenanceCost}c/day</span>
                    </div>
                  )}
                  
                  {enhancedBuilding.unlockRequirement && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Requirement:</span>
                      <span className="ml-auto">{enhancedBuilding.unlockRequirement}</span>
                    </div>
                  )}
                  
                  {isHouse && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Capacity:</span>
                      <span className="ml-auto">
                        {occupants.length}/{building.residentCapacity || 1} residents
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {enhancedBuilding.description && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                  {enhancedBuilding.description}
                </div>
              )}
              
              {building.income > 0 && incomeReady && (
                <button
                  onClick={onCollectIncome}
                  className="w-full p-3 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <DollarSign size={16} />
                  Collect {building.income} coins
                </button>
              )}
            </div>
          )}
          
          {selectedTab === 'management' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Settings size={16} />
                  Maintenance Status
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last maintenance:</span>
                    <span className="text-sm font-medium">
                      {enhancedBuilding.lastMaintenance ? `Day ${enhancedBuilding.lastMaintenance}` : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Days since maintenance:</span>
                    <span className="text-sm font-medium">
                      {currentDay - (enhancedBuilding.lastMaintenance || 0)} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Condition impact:</span>
                    <span className={`text-sm font-medium ${getEfficiencyColor(getEfficiencyScore())}`}>
                      {Math.round((1 - getEfficiencyScore()) * 100)}% efficiency loss
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-800 flex items-center gap-2">
                  <Wrench size={16} />
                  Available Maintenance
                </h3>
                
                {getMaintenanceOptions().map((option) => (
                  <div
                    key={option.id}
                    className={`p-4 border rounded-lg ${
                      option.available 
                        ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
                        : 'border-gray-200 bg-gray-50'
                    } transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-lg">
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{option.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                          <p className="text-xs text-blue-600">{option.effect}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-800">{option.cost}c</div>
                        <button
                          onClick={() => handleMaintenance(option.id)}
                          disabled={!option.available || maintenanceAction === option.id}
                          className={`mt-2 px-3 py-1 text-xs rounded-full ${
                            !option.available
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : maintenanceAction === option.id
                              ? 'bg-green-500 text-white'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {maintenanceAction === option.id ? 'Applied!' : option.available ? 'Apply' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">Building Management</h3>
                
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setShowUpgradesModal(true)}
                    className="p-3 bg-white border border-blue-200 rounded-lg text-blue-600 flex flex-col items-center justify-center gap-2 hover:bg-blue-50"
                  >
                    <ArrowUp size={18} />
                    <span className="text-xs">Upgrade</span>
                  </button>
                  
                  <button
                    onClick={() => onMoveBuilding(gridIndex)}
                    className="p-3 bg-white border border-gray-200 rounded-lg text-gray-600 flex flex-col items-center justify-center gap-2 hover:bg-gray-50"
                  >
                    <Move size={18} />
                    <span className="text-xs">Move</span>
                  </button>
                  
                  <button
                    onClick={() => onSellBuilding(gridIndex)}
                    className="p-3 bg-white border border-red-200 rounded-lg text-red-600 flex flex-col items-center justify-center gap-2 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                    <span className="text-xs">Sell</span>
                  </button>
                </div>
                
                <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-start">
                    <AlertTriangle size={16} className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-yellow-700">
                        Selling returns {Math.floor((enhancedBuilding.value || building.cost || 100) * 0.7)}c (70% of value).
                        All upgrades and improvements will be lost.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedTab === 'analytics' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-100">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BarChart3 size={16} />
                  Performance Analytics
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Efficiency</span>
                        <span className={`text-sm font-medium ${getEfficiencyColor(getEfficiencyScore())}`}>
                          {Math.round(getEfficiencyScore() * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                          style={{ width: `${getEfficiencyScore() * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600">Social Rating</span>
                        <span className="text-sm font-medium text-purple-600">{getSocialRating().toFixed(1)}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${getSocialRating() * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-lg font-bold text-green-600">
                        {building.income ? Math.round(building.income * getEfficiencyScore() * 7) : 0}c
                      </div>
                      <div className="text-xs text-gray-500">weekly income</div>
                    </div>
                    
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-lg font-bold text-blue-600">
                        {hasResidents ? Math.round((occupants.length / (building.residentCapacity || 1)) * 100) : 0}%
                      </div>
                      <div className="text-xs text-gray-500">occupancy rate</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Target size={16} />
                  Efficiency Factors
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Wrench size={12} />
                      Condition
                    </span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getConditionColor(getBuildingCondition())}`}>
                      {getBuildingCondition()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      {weather === 'sunny' ? <Sun size={12} /> : <CloudRain size={12} />}
                      Weather Impact
                    </span>
                    <span className={`text-sm font-medium ${weather === 'sunny' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {weather === 'sunny' ? '+10%' : weather === 'rainy' ? '-5%' : '0%'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <Users size={12} />
                      Occupancy Bonus
                    </span>
                    <span className={`text-sm font-medium ${hasResidents ? 'text-green-600' : 'text-gray-500'}`}>
                      {hasResidents ? '+10%' : '0%'}
                    </span>
                  </div>
                  
                  {building.ecoFriendly && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <Leaf size={12} />
                        Eco-Friendly
                      </span>
                      <span className="text-sm font-medium text-green-600">+5%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Leaf size={16} />
                  Environmental Impact
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{getEnvironmentalRating()}</div>
                      <div className="text-xs text-gray-500">environmental rating</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {building.ecoFriendly && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Leaf size={12} />
                        Eco-friendly design
                      </div>
                    )}
                    {building.wasteReduction && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Droplets size={12} />
                        {building.wasteReduction}% waste reduction
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Flame size={12} className={building.energyUsage < 5 ? 'text-green-600' : 'text-orange-600'} />
                      <span className={building.energyUsage < 5 ? 'text-green-600' : 'text-orange-600'}>
                        {building.energyUsage}u energy use
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'social' && hasResidents && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MessageCircle size={16} />
                  Resident Feedback
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-purple-600">{getSocialRating().toFixed(1)}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          size={16} 
                          className={star <= Math.round(getSocialRating() / 2) ? 'text-yellow-500 fill-current' : 'text-gray-300'} 
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {residentFeedback.length} reviews
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {residentFeedback.map((feedback) => (
                  <div key={feedback.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-800">{feedback.residentName}</div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={12} 
                              className={star <= Math.round(feedback.rating / 2) ? 'text-yellow-500 fill-current' : 'text-gray-300'} 
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          feedback.type === 'praise' ? 'bg-green-100 text-green-600' :
                          feedback.type === 'complaint' ? 'bg-red-100 text-red-600' :
                          feedback.type === 'suggestion' ? 'bg-blue-100 text-blue-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {feedback.type}
                        </span>
                        <span className="text-xs text-gray-500">{feedback.timestamp} days ago</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{feedback.message}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${
                          feedback.category === 'maintenance' ? 'bg-orange-400' :
                          feedback.category === 'comfort' ? 'bg-blue-400' :
                          feedback.category === 'amenities' ? 'bg-purple-400' :
                          feedback.category === 'location' ? 'bg-green-400' :
                          'bg-gray-400'
                        }`}></span>
                        {feedback.category}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 hover:text-blue-600">
                          <ThumbsUp size={12} />
                          <span>Helpful</span>
                        </button>
                        <button className="flex items-center gap-1 hover:text-gray-700">
                          <MessageCircle size={12} />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {residentFeedback.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No resident feedback yet.</p>
                  <p className="text-xs text-gray-400">Feedback will appear as residents interact with the building.</p>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'residents' && isHouse && (
            <div className="space-y-4">
              {hasResidents ? (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2 text-sm flex items-center gap-1 lowercase">
                    <Users size={16} />
                    Current Residents
                  </h3>
                  
                  <div className="space-y-2">
                    {occupants.map((residentId) => {
                      const resident = neighbors.find(n => n.id === residentId);
                      if (!resident) return null;
                      
                      return (
                        <div 
                          key={residentId} 
                          className="p-3 bg-white border border-gray-200 rounded-lg flex justify-between items-center"
                        >
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{resident.avatar}</div>
                            <div>
                              <div className="text-sm font-medium text-gray-700">{resident.name}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span>rent: {resident.dailyRent} coins/day</span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => onRemoveResident(Number(residentId))}
                            className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start">
                  <UserPlus size={20} className="text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-emerald-700 mb-1">This building has no residents yet.</p>
                    <p className="text-xs text-emerald-600">Assign residents to earn daily rent income.</p>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <ResidentAssignment 
                  neighbors={neighbors}
                  grid={grid}
                  onAssignResident={onAssignResident}
                  onRemoveResident={onRemoveResident}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
      
      <AnimatePresence>
        {showUpgradesModal && (
          <BuildingUpgradesModal
            building={building}
            gridIndex={gridIndex}
            onClose={() => setShowUpgradesModal(false)}
            onUpgrade={onUpgradeBuilding}
          />
        )}
      </AnimatePresence>
    </>
  );
}
