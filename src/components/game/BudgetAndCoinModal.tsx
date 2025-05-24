import { useState } from 'react';
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
  Home
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
    const baseEfficiency = 50;
    let efficiency = baseEfficiency;
    
    switch (serviceId) {
      case 'power_grid':
        const powerBuildings = grid.filter(b => b && b.isPowerGenerator).length;
        const powerConsumers = grid.filter(b => b && b.needsElectricity).length;
        if (powerBuildings === 0 && powerConsumers > 0) {
          efficiency = 0;
        } else {
          efficiency = Math.min(95, baseEfficiency + (powerBuildings * 10));
        }
        break;
      case 'water_system':
        const waterBuildings = grid.filter(b => b && b.isWaterSupply).length;
        const waterConsumers = grid.filter(b => b && b.needsWater).length;
        if (waterBuildings === 0 && waterConsumers > 0) {
          efficiency = 0;
        } else {
          efficiency = Math.min(95, baseEfficiency + (waterBuildings * 12));
        }
        break;
      case 'public_services':
        const totalBuildings = grid.filter(b => b).length;
        efficiency = Math.min(90, baseEfficiency + Math.floor(totalBuildings / 3) * 5);
        break;
      case 'education':
        const educationBuildings = grid.filter(b => b && (b.id === 'library' || b.id === 'school')).length;
        efficiency = Math.min(85, baseEfficiency + (educationBuildings * 15));
        break;
      case 'environment':
        const envBuildings = grid.filter(b => b && (b.id === 'park' || b.id === 'recycling_center')).length;
        efficiency = Math.min(80, baseEfficiency + (envBuildings * 10));
        break;
      default:
        efficiency = baseEfficiency;
    }
    
    return Math.round(efficiency);
  };

  const enhancedBudgetSystem = {
    totalBudget: realTotalRevenue,
    buildingIncome: realBuildingIncome,
    taxRevenue: realTaxRevenue,
    totalExpenses: realServiceExpenses,
    budgetSurplus: realBudgetSurplus,
    citizenSatisfaction: Math.round(serviceBudgets.reduce((sum, service) => 
      sum + calculateServiceEfficiency(service.id), 0) / serviceBudgets.length),
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
              +{enhancedBudgetSystem.totalBudget.toLocaleString()}/day
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
            <div className="text-lg font-bold text-red-600">-{enhancedBudgetSystem.totalExpenses.toLocaleString()}</div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600 uppercase tracking-wide">Net Income</div>
            <div className={`text-lg font-bold ${enhancedBudgetSystem.budgetSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {enhancedBudgetSystem.budgetSurplus >= 0 ? '+' : ''}{enhancedBudgetSystem.budgetSurplus.toLocaleString()}
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

  const renderBudgetTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-blue-600" size={24} />
            <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Revenue</div>
          </div>
          <div className="text-2xl font-bold text-blue-800">{enhancedBudgetSystem.totalBudget.toLocaleString()}c</div>
          <div className="text-xs text-blue-600 mt-1">
            Buildings: {enhancedBudgetSystem.buildingIncome.toLocaleString()}c | 
            Taxes: {enhancedBudgetSystem.taxRevenue.toLocaleString()}c
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="text-red-600" size={24} />
            <div className="text-xs font-medium text-red-600 uppercase tracking-wide">Expenses</div>
          </div>
          <div className="text-2xl font-bold text-red-800">{enhancedBudgetSystem.totalExpenses.toLocaleString()}c</div>
          <div className="text-xs text-red-600 mt-1">Service costs per day</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className={`border rounded-xl p-4 shadow-lg ${
            enhancedBudgetSystem.budgetSurplus >= 0 
              ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200' 
              : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            {enhancedBudgetSystem.budgetSurplus >= 0 ? (
              <CheckCircle className="text-green-600" size={24} />
            ) : (
              <AlertTriangle className="text-orange-600" size={24} />
            )}
            <div className={`text-xs font-medium uppercase tracking-wide ${
              enhancedBudgetSystem.budgetSurplus >= 0 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {enhancedBudgetSystem.budgetSurplus >= 0 ? 'Surplus' : 'Deficit'}
            </div>
          </div>
          <div className={`text-2xl font-bold ${
            enhancedBudgetSystem.budgetSurplus >= 0 ? 'text-green-800' : 'text-orange-800'
          }`}>
            {Math.abs(enhancedBudgetSystem.budgetSurplus).toLocaleString()}c
          </div>
          <div className={`text-xs mt-1 ${
            enhancedBudgetSystem.budgetSurplus >= 0 ? 'text-green-600' : 'text-orange-600'
          }`}>
            {enhancedBudgetSystem.budgetSurplus >= 0 ? 'Healthy budget' : 'Need improvement'}
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="text-purple-600" size={24} />
            <div className="text-xs font-medium text-purple-600 uppercase tracking-wide">Satisfaction</div>
          </div>
          <div className="text-2xl font-bold text-purple-800">{Math.round(enhancedBudgetSystem.citizenSatisfaction)}%</div>
          <div className="text-xs text-purple-600 mt-1">Citizen happiness</div>
        </motion.div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Settings className="mr-2 text-gray-600" size={20} />
            Service Budget Allocation
          </h3>
          <div className="text-sm text-gray-500">
            Total: {enhancedBudgetSystem.totalExpenses.toLocaleString()}c/day
          </div>
        </div>
        
        {serviceBudgets.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-lg hover:shadow-xl transition-shadow"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 rounded-full p-2">
                  {getServiceIcon(service.id)}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">{service.name}</div>
                  <div className="text-sm text-gray-500">{service.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${getBudgetColor(service.currentBudget)}`}>
                  {service.currentBudget}%
                </div>
                <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {Math.round(service.baseCost * service.currentBudget / 100).toLocaleString()}c/day
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs text-gray-600 font-medium">
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded">50% (Minimum)</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">100% (Standard)</span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">150% (Enhanced)</span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">200% (Premium)</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="5"
                  value={service.currentBudget}
                  onChange={(e) => onUpdateServiceBudget(service.id, parseInt(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-red-200 via-blue-200 via-green-200 to-purple-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      #fecaca 0%, #fecaca 25%, 
                      #bfdbfe 25%, #bfdbfe 50%, 
                      #bbf7d0 50%, #bbf7d0 75%, 
                      #e9d5ff 75%, #e9d5ff 100%)`
                  }}
                />
                <div 
                  className="absolute top-0 w-4 h-3 bg-gray-800 rounded-full shadow-lg pointer-events-none"
                  style={{ 
                    left: `calc(${((service.currentBudget - 50) / 150) * 100}% - 8px)`,
                    top: '0px'
                  }}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
                <span>Service Efficiency</span>
                <span className="text-gray-800">{calculateServiceEfficiency(service.id)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateServiceEfficiency(service.id)}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-3 rounded-full ${getEfficiencyColor(calculateServiceEfficiency(service.id))} shadow-sm`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderTaxesTab = () => (
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

      {taxPolicies.map(policy => (
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
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={policy.rate}
                onChange={(e) => onUpdateTaxPolicy(policy.id, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

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
            <span className="font-medium">{enhancedBudgetSystem.buildingIncome}c</span>
          </div>
          <div className="flex justify-between">
            <span>Tax Revenue</span>
            <span className="font-medium">{enhancedBudgetSystem.taxRevenue}c</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total Revenue</span>
            <span>{enhancedBudgetSystem.totalBudget}c</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-3">Budget Health Analysis</h3>
        <div className="space-y-3">
          <div className={`p-3 rounded-lg ${
            enhancedBudgetSystem.budgetSurplus >= 100 ? 'bg-green-50' :
            enhancedBudgetSystem.budgetSurplus >= 0 ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center">
              {enhancedBudgetSystem.budgetSurplus >= 100 ? (
                <CheckCircle className="text-green-600 mr-2" size={20} />
              ) : enhancedBudgetSystem.budgetSurplus >= 0 ? (
                <Info className="text-yellow-600 mr-2" size={20} />
              ) : (
                <AlertTriangle className="text-red-600 mr-2" size={20} />
              )}
              <div>
                <div className={`font-medium ${
                  enhancedBudgetSystem.budgetSurplus >= 100 ? 'text-green-800' :
                  enhancedBudgetSystem.budgetSurplus >= 0 ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {enhancedBudgetSystem.budgetSurplus >= 100 ? 'Excellent Budget Health' :
                   enhancedBudgetSystem.budgetSurplus >= 0 ? 'Stable Budget' : 'Budget Deficit'}
                </div>
                <div className={`text-sm ${
                  enhancedBudgetSystem.budgetSurplus >= 100 ? 'text-green-700' :
                  enhancedBudgetSystem.budgetSurplus >= 0 ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {enhancedBudgetSystem.budgetSurplus >= 100 ? 
                    'Your city is financially strong with room for expansion' :
                   enhancedBudgetSystem.budgetSurplus >= 0 ? 
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
          {activeTab === 'coins' && renderCoinsTab()}
          {activeTab === 'budget' && renderBudgetTab()}
          {activeTab === 'taxes' && renderTaxesTab()}
          {activeTab === 'analysis' && renderAnalysisTab()}
        </div>
      </motion.div>
    </motion.div>
  );
} 