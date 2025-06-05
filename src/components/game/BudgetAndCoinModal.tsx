import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  DollarSign, 
  History,
  Settings, 
  Zap, 
  Droplets, 
  Shield, 
  GraduationCap, 
  Recycle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  PieChart,
  BarChart3,
  Wrench,
  Info,
  Coins,
  Building,
  Users,
  Home,
  Wallet,
  Calculator,
  Heart,
  Leaf,
  Trophy,
  Lock
} from 'lucide-react';
import type { 
  ServiceBudget, 
  CityBudgetSystem, 
  TaxPolicy,
  InfrastructureUpgrade,
  CoinHistoryEntry,
  Building as BuildingType
} from '../../types/game';
import { 
  DEFAULT_SERVICE_BUDGETS,
  INFRASTRUCTURE_UPGRADES,
  updateServiceBudget,
  calculateCityBudgetSystem,
  calculateServiceEffects,
  updateTaxPolicy,
  toggleTaxPolicy
} from '../../data/taxPolicies';

type BudgetAndCoinModalProps = {
  coins: number;
  coinHistory: CoinHistoryEntry[];
  buildings: any[];
  currentDay: number;
  taxPolicies: TaxPolicy[];
  serviceBudgets?: ServiceBudget[];
  infrastructureUpgrades?: string[];
  cityBudgetSystem?: CityBudgetSystem;
  onUpdateServiceBudget: (serviceId: string, newBudgetPercentage: number) => void;
  onUpdateTaxPolicy: (policyId: string, rate: number) => void;
  onToggleTaxPolicy: (policyId: string) => void;
  onPurchaseInfrastructureUpgrade: (upgradeId: string) => void;
  onClose: () => void;
  playerLevel: number;
  grid: (BuildingType | null)[];
};

export default function BudgetAndCoinModal({
  coins,
  coinHistory,
  buildings,
  currentDay,
  taxPolicies,
  serviceBudgets = DEFAULT_SERVICE_BUDGETS,
  infrastructureUpgrades = [],
  cityBudgetSystem,
  onUpdateServiceBudget,
  onUpdateTaxPolicy,
  onToggleTaxPolicy,
  onPurchaseInfrastructureUpgrade,
  onClose,
  playerLevel,
  grid
}: BudgetAndCoinModalProps) {
  const [activeTab, setActiveTab] = useState<'coins' | 'budget' | 'taxes' | 'infrastructure' | 'analysis'>('coins');
  const [notification, setNotification] = useState<{ serviceId: string; percentage: number } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingBudgetUpdates, setPendingBudgetUpdates] = useState<{[serviceId: string]: number}>({});
  const [budgetUpdateTimeouts, setBudgetUpdateTimeouts] = useState<{[serviceId: string]: NodeJS.Timeout}>({});
  const handleBudgetChange = (serviceId: string, newPercentage: number) => {
    setPendingBudgetUpdates(prev => ({
      ...prev,
      [serviceId]: newPercentage
    }));

    if (budgetUpdateTimeouts[serviceId]) {
      clearTimeout(budgetUpdateTimeouts[serviceId]);
    }

    const timeoutId = setTimeout(() => {
      onUpdateServiceBudget(serviceId, newPercentage);
    }, 500);

    setBudgetUpdateTimeouts(prev => ({
      ...prev,
      [serviceId]: timeoutId
    }));
  };

  const getCurrentBudgetPercentage = (service: ServiceBudget): number => {
    const serviceId = service.id;
    const pendingValue = pendingBudgetUpdates[serviceId];
    const currentValue = Math.round((service.currentBudget / service.baseCost) * 100);
    
    if (pendingValue !== undefined) {
      return pendingValue;
    }
    
    return currentValue;
  };  
  useEffect(() => {
    const updatedPending = { ...pendingBudgetUpdates };
    let hasChanges = false;

    serviceBudgets.forEach(service => {
      const serviceId = service.id;
      const currentPercentage = Math.round((service.currentBudget / service.baseCost) * 100);
      const pendingPercentage = pendingBudgetUpdates[serviceId];
      
      if (pendingPercentage !== undefined) {
        const diff = Math.abs(pendingPercentage - currentPercentage);
        
        if (diff <= 5) {
          delete updatedPending[serviceId];
          hasChanges = true;
          
          if (budgetUpdateTimeouts[serviceId]) {
            clearTimeout(budgetUpdateTimeouts[serviceId]);
            setBudgetUpdateTimeouts(prev => {
              const updated = { ...prev };
              delete updated[serviceId];
              return updated;
            });
          }
        }
      }
    });

    if (hasChanges) {
      setPendingBudgetUpdates(updatedPending);
    }
  }, [serviceBudgets]);
  useEffect(() => {
    if (Object.keys(pendingBudgetUpdates).length > 0) {
      const cleanupTimer = setTimeout(() => {
        setPendingBudgetUpdates({});
        setBudgetUpdateTimeouts({});
      }, 10000);

      return () => clearTimeout(cleanupTimer);
    }
  }, [pendingBudgetUpdates, serviceBudgets]);
  const handleTaxPolicyChange = useCallback((policyId: string, newRate: number) => {
    onUpdateTaxPolicy(policyId, newRate);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setNotification({ serviceId: `tax-${policyId}`, percentage: newRate });
      
      setTimeout(() => setNotification(null), 2000);    }, 500);
  }, [onUpdateTaxPolicy]);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const calculateRealBuildingIncome = () => {
    return grid.filter(building => building !== null).reduce((total, building) => {
      return total + (building!.income || 0);
    }, 0);
  };

  const calculateRealTaxRevenue = () => {
    const activeTaxes = taxPolicies.filter(policy => policy.enabled);
    const totalBuildingIncome = calculateRealBuildingIncome();
    
    return activeTaxes.reduce((total, policy) => {
      return total + (totalBuildingIncome * policy.rate / 100 * policy.revenueMultiplier);
    }, 0);
  };

  const calculateRealServiceExpenses = () => {
    return serviceBudgets.reduce((total, service) => {
      return total + Math.round(service.baseCost * service.currentBudget / 100);
    }, 0);
  };

  const realBuildingIncome = calculateRealBuildingIncome();
  const realTaxRevenue = calculateRealTaxRevenue();
  const realServiceExpenses = calculateRealServiceExpenses();
  const realTotalRevenue = realBuildingIncome + realTaxRevenue;
  const realBudgetSurplus = realTotalRevenue - realServiceExpenses;

  const calculateServiceEfficiency = (serviceId: string) => {
    let efficiency = 0;
    let details = { buildings: 0, consumers: 0, coverage: 0 };
    
    switch (serviceId) {
      case 'power_grid':
        const powerBuildings = grid.filter(b => b && b.isPowerGenerator).length;
        const powerConsumers = grid.filter(b => b && b.needsElectricity).length;
        details = { buildings: powerBuildings, consumers: powerConsumers, coverage: 0 };
          if (powerBuildings === 0) {
          efficiency = powerConsumers > 0 ? 0 : 20;
        } else {
          const ratio = powerConsumers > 0 ? powerBuildings / powerConsumers : 1;
          const baseEfficiency = Math.min(90, 30 + (powerBuildings * 12));
          efficiency = Math.min(95, baseEfficiency * Math.min(1.2, ratio));
        }
        break;
        
      case 'water_system':
        const waterBuildings = grid.filter(b => b && b.isWaterSupply).length;
        const waterConsumers = grid.filter(b => b && b.needsWater).length;
        details = { buildings: waterBuildings, consumers: waterConsumers, coverage: 0 };
        
        if (waterBuildings === 0) {
          efficiency = waterConsumers > 0 ? 0 : 25;
        } else {
          const ratio = waterConsumers > 0 ? waterBuildings / waterConsumers : 1;
          const baseEfficiency = Math.min(85, 25 + (waterBuildings * 15));
          efficiency = Math.min(95, baseEfficiency * Math.min(1.3, ratio));
        }
        break;
        
      case 'public_services':
        const totalBuildings = grid.filter(b => b).length;
        const residentialBuildings = grid.filter(b => b && (b.id === 'house' || b.id === 'apartment' || b.id === 'condo')).length;
        details = { buildings: totalBuildings, consumers: residentialBuildings, coverage: 0 };
          if (residentialBuildings === 0) {
          efficiency = 40;
        } else {
          const serviceRatio = totalBuildings / Math.max(1, residentialBuildings);
          efficiency = Math.min(90, 20 + (totalBuildings * 3) + (serviceRatio * 10));
        }
        break;
        
      case 'education':
        const educationBuildings = grid.filter(b => b && (b.id === 'library' || b.id === 'school')).length;
        const residentsCount = grid.filter(b => b && (b.id === 'house' || b.id === 'apartment' || b.id === 'condo')).length;
        details = { buildings: educationBuildings, consumers: residentsCount, coverage: 0 };
          if (educationBuildings === 0) {
          efficiency = residentsCount > 0 ? 15 : 30;
        } else {
          const ratio = residentsCount > 0 ? educationBuildings / residentsCount : 1;
          efficiency = Math.min(95, 15 + (educationBuildings * 20) + (ratio * 25));
        }
        break;
        
      case 'environment':
        const envBuildings = grid.filter(b => b && (b.id === 'park' || b.id === 'recycling_center')).length;
        const allBuildings = grid.filter(b => b).length;
        details = { buildings: envBuildings, consumers: allBuildings, coverage: 0 };
          if (envBuildings === 0) {
          efficiency = allBuildings > 5 ? 10 : 35;
        } else {
          const ratio = allBuildings > 0 ? envBuildings / allBuildings : 1;
          efficiency = Math.min(90, 20 + (envBuildings * 15) + (ratio * 40));
        }
        break;
        
      default:
        efficiency = 30;
    }
    
    return { efficiency: Math.round(efficiency), details };
  };

  const getEfficiencyInfo = (serviceId: string) => {
    const result = calculateServiceEfficiency(serviceId);
    const efficiency = result.efficiency;
    
    let status = 'Poor';
    let statusColor = 'text-red-600';
    let bgColor = 'bg-red-500';
    
    if (efficiency >= 80) {
      status = 'Excellent';
      statusColor = 'text-green-600';
      bgColor = 'bg-gradient-to-r from-green-400 to-emerald-500';
    } else if (efficiency >= 65) {
      status = 'Good';
      statusColor = 'text-blue-600';
      bgColor = 'bg-gradient-to-r from-blue-400 to-blue-500';
    } else if (efficiency >= 45) {
      status = 'Fair';
      statusColor = 'text-yellow-600';
      bgColor = 'bg-gradient-to-r from-yellow-400 to-orange-500';
    } else if (efficiency >= 25) {
      status = 'Poor';
      statusColor = 'text-orange-600';
      bgColor = 'bg-gradient-to-r from-orange-400 to-red-500';
    }
    
    return { efficiency, status, statusColor, bgColor, details: result.details };
  };

  const enhancedBudgetSystem = {
    totalBudget: realTotalRevenue,
    buildingIncome: realBuildingIncome,
    taxRevenue: realTaxRevenue,
    totalExpenses: realServiceExpenses,
    budgetSurplus: realBudgetSurplus,
    citizenSatisfaction: Math.round(serviceBudgets.reduce((sum, service) => 
      sum + getEfficiencyInfo(service.id).efficiency, 0) / serviceBudgets.length),
    infrastructureHealth: 85
  };

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'power_grid': return <Zap className="text-yellow-500" size={20} />;
      case 'water_system': return <Droplets className="text-blue-500" size={20} />;
      case 'public_services': return <Shield className="text-red-500" size={20} />;
      case 'education': return <GraduationCap className="text-purple-500" size={20} />;
      case 'environment': return <Recycle className="text-green-500" size={20} />;
      default: return <Settings size={20} />;
    }
  };

  const getBudgetColor = (budgetPercentage: number) => {
    if (budgetPercentage >= 120) return 'text-green-600';
    if (budgetPercentage >= 90) return 'text-blue-600';
    if (budgetPercentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'bg-gradient-to-r from-green-400 to-green-500';
    if (efficiency >= 60) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    return 'bg-gradient-to-r from-red-400 to-red-500';
  };

  const getServiceBgColor = (serviceId: string) => {
    switch (serviceId) {
      case 'power_grid': return 'bg-yellow-100';
      case 'water_system': return 'bg-blue-100';
      case 'waste_management': return 'bg-green-100';
      case 'public_transport': return 'bg-purple-100';
      case 'emergency_services': return 'bg-red-100';
      case 'education': return 'bg-indigo-100';
      default: return 'bg-gray-100';
    }
  };

  const getEfficiencyTextColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-green-600';
    if (efficiency >= 60) return 'text-yellow-600';
    if (efficiency >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBudgetBadgeColor = (percentage: number) => {
    if (percentage >= 150) return 'bg-green-100 text-green-800';
    if (percentage >= 100) return 'bg-blue-100 text-blue-800';
    if (percentage >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const renderCoinsTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-yellow-100 via-yellow-50 to-amber-100 border-2 border-yellow-200 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-500 rounded-full p-3 shadow-md">
              <Coins className="text-white" size={28} />
            </div>
            <div>
              <div className="text-sm font-medium text-yellow-700 uppercase tracking-wide">Current Balance</div>
              <div className="text-3xl font-bold text-yellow-900">{coins.toLocaleString()} coins</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-yellow-700 uppercase tracking-wide">Daily Income</div>
            <div className="text-2xl font-bold text-yellow-900 flex items-center">
              <TrendingUp className="mr-1 text-green-600" size={20} />
              +{enhancedBudgetSystem.totalBudget.toLocaleString()} coins/day
            </div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600 uppercase tracking-wide">Buildings</div>
            <div className="text-lg font-bold text-gray-800">{grid.filter(b => b).length}</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600 uppercase tracking-wide">Daily Expenses</div>
            <div className="text-lg font-bold text-red-600">-{enhancedBudgetSystem.totalExpenses.toLocaleString()} coins</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600 uppercase tracking-wide">Net Income</div>
            <div className={`text-lg font-bold ${enhancedBudgetSystem.budgetSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {enhancedBudgetSystem.budgetSurplus >= 0 ? '+' : ''}{enhancedBudgetSystem.budgetSurplus.toLocaleString()} coins
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <History className="mr-2 text-blue-600" size={20} />
            Recent Transactions
          </h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {coinHistory.slice(-15).reverse().map((entry, index) => (
            <motion.div 
              key={entry.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full shadow-sm ${
                  entry.type === 'income' 
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : 'bg-gradient-to-r from-red-400 to-red-500'
                }`} />
                <div>
                  <div className="text-sm font-medium text-gray-800">{entry.description}</div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span>Day {entry.day}</span>
                    <span className="mx-1">•</span>
                    <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
              <div className={`font-bold text-lg ${
                entry.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {entry.type === 'income' ? '+' : '-'}{entry.amount.toLocaleString()}c
              </div>
            </motion.div>
          ))}
          {coinHistory.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Coins className="mx-auto mb-2 text-gray-300" size={32} />
              <div className="text-lg">No transactions yet</div>
              <div className="text-sm">Your financial history will appear here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  const renderBudgetTab = () => {
    const unlockedServices = serviceBudgets.filter(service => service.unlockLevel <= playerLevel);
    const lockedServices = serviceBudgets.filter(service => service.unlockLevel > playerLevel);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6 mb-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6 rounded-2xl border-2 border-emerald-200 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Total Budget</p>
                <p className="text-3xl font-bold text-emerald-900 mt-1">
                  {cityBudgetSystem?.totalBudget?.toLocaleString() || '0'} coins
                </p>
                <p className="text-xs text-emerald-600 mt-1">Monthly allocation</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Wallet className="text-white" size={28} />
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Allocated</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">
                  {cityBudgetSystem?.allocatedBudget?.toLocaleString() || '0'} coins
                </p>
                <p className="text-xs text-blue-600 mt-1">Currently spending</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="text-white" size={28} />
              </div>
            </div>
          </motion.div>
        </div>

        {playerLevel < 6 && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Trophy className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-purple-800">City Development Progress</p>
                  <p className="text-sm text-purple-600">Level {playerLevel} • {lockedServices.length} services locked</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-purple-600">Next unlock at Level {Math.min(...lockedServices.map(s => s.unlockLevel))}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Settings className="text-white" size={18} />
              </div>
              Service Budget Allocation
            </h3>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {unlockedServices.length}/{serviceBudgets.length} Services Available
            </div>
          </div>
          
          <div className="grid gap-6">
            {unlockedServices.map((service, index) => {
              const efficiencyInfo = getEfficiencyInfo(service.id);
              const budgetPercentage = getCurrentBudgetPercentage(service);
              const isPending = pendingBudgetUpdates[service.id] !== undefined;
              
              return (
                <motion.div 
                  key={service.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-gray-200 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${getServiceBgColor(service.id)}`}>
                        {getServiceIcon(service.id)}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{service.name}</h4>
                        <p className="text-sm text-gray-600 max-w-xs">{service.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="none"
                            stroke="#f3f4f6"
                            strokeWidth="8"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="none"
                            stroke={getEfficiencyColor(efficiencyInfo.efficiency)}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${(efficiencyInfo.efficiency / 100) * 251.3} 251.3`}
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <span className={`text-xl font-bold ${getEfficiencyTextColor(efficiencyInfo.efficiency)}`}>
                              {Math.round(efficiencyInfo.efficiency)}%
                            </span>
                            <div className={`text-xs font-semibold ${efficiencyInfo.statusColor} mt-1`}>
                              {efficiencyInfo.status}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="min-w-48 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg">
                            <Building size={14} className="text-blue-500" />
                            <div>
                              <div className="font-medium text-blue-700">Buildings</div>
                              <div className="text-blue-600">{efficiencyInfo.details.buildings}</div>
                            </div>
                          </div>
                          
                          {service.id !== 'public_services' && (
                            <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-lg">
                              <Users size={14} className="text-purple-500" />
                              <div>
                                <div className="font-medium text-purple-700">
                                  {service.id === 'power_grid' ? 'Consumers' : 
                                   service.id === 'water_system' ? 'Consumers' :
                                   service.id === 'education' ? 'Residents' : 'Coverage'}
                                </div>
                                <div className="text-purple-600">{efficiencyInfo.details.consumers}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                          {service.id === 'power_grid' && efficiencyInfo.details.buildings === 0 && efficiencyInfo.details.consumers > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle size={12} />
                              <span>Build power plants to supply electricity</span>
                            </div>
                          )}
                          {service.id === 'power_grid' && efficiencyInfo.details.buildings > 0 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={12} />
                              <span>Good power coverage</span>
                            </div>
                          )}
                          
                          {service.id === 'water_system' && efficiencyInfo.details.buildings === 0 && efficiencyInfo.details.consumers > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle size={12} />
                              <span>Build water sources for supply</span>
                            </div>
                          )}
                          {service.id === 'water_system' && efficiencyInfo.details.buildings > 0 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={12} />
                              <span>Water system operational</span>
                            </div>
                          )}
                          
                          {service.id === 'education' && efficiencyInfo.details.buildings === 0 && efficiencyInfo.details.consumers > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle size={12} />
                              <span>Build schools and libraries</span>
                            </div>
                          )}
                          {service.id === 'education' && efficiencyInfo.details.buildings > 0 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={12} />
                              <span>Education facilities available</span>
                            </div>
                          )}
                          
                          {service.id === 'environment' && efficiencyInfo.details.buildings === 0 && efficiencyInfo.details.consumers > 5 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertTriangle size={12} />
                              <span>Add parks and recycling centers</span>
                            </div>
                          )}
                          {service.id === 'environment' && efficiencyInfo.details.buildings > 0 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={12} />
                              <span>Environmental services active</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Budget Allocation</span>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getBudgetBadgeColor(budgetPercentage)}`}>
                          {budgetPercentage}%
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.round(service.baseCost * (budgetPercentage / 100))} coins/month
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="w-full h-6 rounded-lg shadow-inner border border-gray-300 bg-gradient-to-r from-red-100 via-yellow-100 to-green-100">
                        <div 
                          className={`absolute top-0 left-0 h-full rounded-lg shadow-sm transition-all duration-200 ${getBudgetColor(budgetPercentage)}`}
                          style={{ width: `${budgetPercentage}%` }}
                        />
                        
                        <input
                          type="range"
                          min="0"
                          max="200"
                          step="5"
                          value={pendingBudgetUpdates[service.id] !== undefined ? pendingBudgetUpdates[service.id] : budgetPercentage}
                          onChange={(e) => handleBudgetChange(service.id, parseInt(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer budget-slider"
                        />
                        
                        <div 
                          className="absolute top-1/2 w-6 h-6 bg-white border-2 rounded-full shadow-lg transform -translate-y-1/2 -translate-x-3 pointer-events-none transition-all duration-200"
                          style={{ 
                            left: `${budgetPercentage}%`,
                            borderColor: budgetPercentage >= 150 ? '#10b981' : budgetPercentage >= 100 ? '#3b82f6' : budgetPercentage >= 50 ? '#f59e0b' : '#ef4444'
                          }}
                        >
                          <div 
                            className="w-full h-full rounded-full scale-75"
                            style={{ 
                              backgroundColor: budgetPercentage >= 150 ? '#10b981' : budgetPercentage >= 100 ? '#3b82f6' : budgetPercentage >= 50 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                        <span>150%</span>
                        <span>200%</span>
                      </div>
                    </div>
                    
                    {isPending && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => applyBudgetChange(service.id)}
                          className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => resetBudgetChange(service.id)}
                          className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {lockedServices.map((service, index) => (
              <motion.div
                key={`locked-${service.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (unlockedServices.length + index) * 0.1 }}
                className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-6 opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gray-300">
                      {getServiceIcon(service.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-gray-600">{service.name}</h4>
                        <Lock className="text-gray-400" size={16} />
                      </div>
                      <p className="text-sm text-gray-500 max-w-xs">{service.description}</p>
                    </div>
                  </div>
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    Unlocks at Level {service.unlockLevel}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const applyBudgetChange = (serviceId: string) => {
    if (pendingBudgetUpdates[serviceId] !== undefined) {
      onUpdateServiceBudget(serviceId, pendingBudgetUpdates[serviceId]);
      setPendingBudgetUpdates(prev => {
        const updated = { ...prev };
        delete updated[serviceId];
        return updated;
      });
    }
  };

  const resetBudgetChange = (serviceId: string) => {
    setPendingBudgetUpdates(prev => {
      const updated = { ...prev };
      delete updated[serviceId];
      return updated;
    });
  };
  const renderTaxesTab = () => {
    const unlockedPolicies = taxPolicies.filter(policy => policy.unlockLevel <= playerLevel);
    const lockedPolicies = taxPolicies.filter(policy => policy.unlockLevel > playerLevel);

    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-600 mr-2" size={20} />
            <div>
              <div className="font-medium text-yellow-800">Tax Policy Effects</div>
              <div className="text-sm text-yellow-700">
                Higher taxes reduce citizen happiness but increase revenue
              </div>
            </div>
          </div>
        </div>

        {playerLevel < 7 && lockedPolicies.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-blue-800">Tax Policy Development</p>
                  <p className="text-sm text-blue-600">Level {playerLevel} • {lockedPolicies.length} policies locked</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-600">Next unlock at Level {Math.min(...lockedPolicies.map(p => p.unlockLevel))}</p>
              </div>
            </div>
          </div>
        )}

        {unlockedPolicies.map(policy => (
          <motion.div
            key={policy.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={policy.enabled}
                  onChange={() => onToggleTaxPolicy(policy.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-800">{policy.name}</div>
                  <div className="text-sm text-gray-500">{policy.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">{policy.rate}%</div>
                <div className="text-sm text-gray-500">
                  {policy.happinessImpact < 0 ? '' : '+'}{policy.happinessImpact} community satisfaction
                </div>
              </div>
            </div>
            
            {policy.enabled && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>0%</span>
                  <span>15%</span>
                  <span>30%</span>
                </div>
                
                <div className="relative">
                  <div 
                    className="w-full h-4 rounded-lg shadow-inner border border-gray-300 bg-gradient-to-r from-green-200 to-red-200"
                  >
                    <div 
                      className="absolute top-0 left-0 h-full rounded-lg shadow-sm transition-all duration-200 bg-gradient-to-r from-green-400 to-red-400"
                      style={{ width: `${(policy.rate / 30) * 100}%` }}
                    />
                    
                    <input
                      type="range"
                      min="0"
                      max="30"
                      step="1"
                      value={policy.rate}
                      onChange={(e) => handleTaxPolicyChange(policy.id, parseInt(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    <div 
                      className="absolute top-1/2 w-4 h-4 bg-white border-2 rounded-full shadow-lg transform -translate-y-1/2 -translate-x-2 pointer-events-none transition-all duration-200"
                      style={{ 
                        left: `${(policy.rate / 30) * 100}%`,
                        borderColor: policy.rate > 20 ? '#ef4444' : policy.rate > 10 ? '#f59e0b' : '#10b981'
                      }}
                    >
                      <div 
                        className="w-full h-full rounded-full scale-75"
                        style={{ 
                          backgroundColor: policy.rate > 20 ? '#ef4444' : policy.rate > 10 ? '#f59e0b' : '#10b981'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {lockedPolicies.map(policy => (
          <motion.div
            key={`locked-${policy.id}`}
            className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 opacity-75"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={false}
                  disabled
                  className="w-4 h-4 text-gray-400 rounded cursor-not-allowed"
                />
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-medium text-gray-600 flex items-center gap-2">
                      {policy.name}
                      <Lock className="text-gray-400" size={14} />
                    </div>
                    <div className="text-sm text-gray-500">{policy.description}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-gray-600">{policy.rate}%</div>
                  <div className="text-sm text-gray-500">
                    {policy.happinessImpact < 0 ? '' : '+'}{policy.happinessImpact} community satisfaction
                  </div>
                </div>
                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  Level {policy.unlockLevel}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderAnalysisTab = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-3 flex items-center">
          <PieChart className="mr-2" size={20} />
          Revenue Breakdown
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Building Income</span>
            <span className="font-medium">{realBuildingIncome} coins</span>
          </div>
          <div className="flex justify-between">
            <span>Tax Revenue</span>
            <span className="font-medium">{realTaxRevenue} coins</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total Revenue</span>
            <span>{realTotalRevenue} coins</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-3">Budget Health Analysis</h3>
        <div className="space-y-3">
          <div className={`p-3 rounded-lg ${
            realBudgetSurplus >= 100 ? 'bg-green-50' :
            realBudgetSurplus >= 0 ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center">
              {realBudgetSurplus >= 100 ? (
                <CheckCircle className="text-green-600 mr-2" size={20} />
              ) : realBudgetSurplus >= 0 ? (
                <Info className="text-yellow-600 mr-2" size={20} />
              ) : (
                <AlertTriangle className="text-red-600 mr-2" size={20} />
              )}
              <div>
                <div className={`font-medium ${
                  realBudgetSurplus >= 100 ? 'text-green-800' :
                  realBudgetSurplus >= 0 ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {realBudgetSurplus >= 100 ? 'Excellent Budget Health' :
                   realBudgetSurplus >= 0 ? 'Stable Budget' : 'Budget Deficit'}
                </div>
                <div className={`text-sm ${
                  realBudgetSurplus >= 100 ? 'text-green-700' :
                  realBudgetSurplus >= 0 ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {realBudgetSurplus >= 100 ? 
                    'Your city is financially strong with room for expansion' :
                   realBudgetSurplus >= 0 ? 
                    'Budget is balanced but consider improving revenue' :
                    'Reduce expenses or increase taxes to balance budget'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium flex items-center">
            <DollarSign size={20} className="mr-2" />
            Finance & Budget Management
          </h2>
          <button onClick={onClose} className="text-white hover:text-yellow-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex border-b border-gray-200">
          {[
            { id: 'coins', label: 'Balance & History', icon: Coins },
            { id: 'budget', label: 'Service Budgets', icon: Settings },
            { id: 'taxes', label: 'Tax Policies', icon: DollarSign },
            { id: 'analysis', label: 'Analysis', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                className="fixed top-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg border border-blue-500"
              >
                <div className="flex items-center space-x-2">
                  {notification.serviceId.startsWith('tax-') ? <DollarSign size={16} /> : <Settings size={16} />}
                  <div>
                    <div className="font-medium text-sm">
                      {notification.serviceId.startsWith('tax-') ? 'Tax Policy Updated' : 'Budget Updated'}
                    </div>
                    <div className="text-xs opacity-90">
                      {notification.serviceId.startsWith('tax-') 
                        ? `Tax rate: ${notification.percentage}%`
                        : `Service allocation: ${notification.percentage}%`
                      }
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'coins' && renderCoinsTab()}
          {activeTab === 'budget' && renderBudgetTab()}
          {activeTab === 'taxes' && renderTaxesTab()}
          {activeTab === 'analysis' && renderAnalysisTab()}
        </div>
      </motion.div>
    </motion.div>
  );
}