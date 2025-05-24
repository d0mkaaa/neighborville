import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings, 
  Zap, 
  Droplets, 
  Shield, 
  GraduationCap, 
  Car, 
  Recycle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  PieChart,
  BarChart3,
  Wrench,
  Plus,
  Info
} from 'lucide-react';
import type { 
  ServiceBudget, 
  CityBudgetSystem, 
  TaxPolicy,
  InfrastructureUpgrade 
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

type BudgetManagementPanelProps = {
  buildings: any[];
  coins: number;
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
};

export default function BudgetManagementPanel({
  buildings,
  coins,
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
  playerLevel
}: BudgetManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<'budget' | 'taxes' | 'infrastructure' | 'analysis'>('budget');
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const currentBudgetSystem = cityBudgetSystem || calculateCityBudgetSystem(
    buildings,
    taxPolicies,
    serviceBudgets,
    infrastructureUpgrades
  );

  const serviceEffects = calculateServiceEffects(serviceBudgets);

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'power_grid': return <Zap className="text-yellow-500" size={20} />;
      case 'water_system': return <Droplets className="text-blue-500" size={20} />;
      case 'public_services': return <Shield className="text-red-500" size={20} />;
      case 'education': return <GraduationCap className="text-purple-500" size={20} />;
      case 'transportation': return <Car className="text-gray-600" size={20} />;
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
    if (efficiency >= 80) return 'bg-green-500';
    if (efficiency >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const renderBudgetTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-blue-600 text-sm font-medium">Total Revenue</div>
          <div className="text-blue-800 text-lg font-bold">{currentBudgetSystem.totalBudget}c</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="text-red-600 text-sm font-medium">Total Expenses</div>
          <div className="text-red-800 text-lg font-bold">{currentBudgetSystem.totalExpenses}c</div>
        </div>
        <div className={`p-3 rounded-lg ${currentBudgetSystem.budgetSurplus >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`text-sm font-medium ${currentBudgetSystem.budgetSurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Budget {currentBudgetSystem.budgetSurplus >= 0 ? 'Surplus' : 'Deficit'}
          </div>
          <div className={`text-lg font-bold ${currentBudgetSystem.budgetSurplus >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            {Math.abs(currentBudgetSystem.budgetSurplus)}c
          </div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-purple-600 text-sm font-medium">Citizen Satisfaction</div>
          <div className="text-purple-800 text-lg font-bold">{Math.round(currentBudgetSystem.citizenSatisfaction)}%</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">Service Budgets</h3>
        {serviceBudgets.map(service => (
          <motion.div
            key={service.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getServiceIcon(service.id)}
                <div>
                  <div className="font-medium text-gray-800">{service.name}</div>
                  <div className="text-sm text-gray-500">{service.description}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${getBudgetColor(service.currentBudget)}`}>
                  {service.currentBudget}%
                </div>
                <div className="text-sm text-gray-500">
                  {Math.round(service.baseCost * service.currentBudget / 100)}c/day
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>50%</span>
                <span>100%</span>
                <span>150%</span>
                <span>200%</span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="5"
                value={service.currentBudget}
                onChange={(e) => onUpdateServiceBudget(service.id, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Efficiency</span>
                <span>{Math.round(service.efficiency)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getEfficiencyColor(service.efficiency)}`}
                  style={{ width: `${service.efficiency}%` }}
                />
              </div>
            </div>

            {service.effects.communitySatisfaction !== 0 && (
              <div className="mt-2 text-sm">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                  service.effects.communitySatisfaction > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {service.effects.communitySatisfaction > 0 ? '+' : ''}{service.effects.communitySatisfaction} Community Satisfaction
                </span>
              </div>
            )}
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

  const renderInfrastructureTab = () => {
    const availableUpgrades = INFRASTRUCTURE_UPGRADES.filter(upgrade => 
      !infrastructureUpgrades.includes(upgrade.id) && 
      playerLevel >= upgrade.unlockLevel &&
      (!upgrade.prerequisite || infrastructureUpgrades.includes(upgrade.prerequisite))
    );

    const completedUpgrades = INFRASTRUCTURE_UPGRADES.filter(upgrade => 
      infrastructureUpgrades.includes(upgrade.id)
    );

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Wrench className="text-blue-600 mr-2" size={20} />
            <div>
              <div className="font-medium text-blue-800">Infrastructure Health</div>
              <div className="text-sm text-blue-700">
                {Math.round(currentBudgetSystem.infrastructureHealth)}% - {
                  currentBudgetSystem.infrastructureHealth >= 80 ? 'Excellent' :
                  currentBudgetSystem.infrastructureHealth >= 60 ? 'Good' :
                  currentBudgetSystem.infrastructureHealth >= 40 ? 'Fair' : 'Poor'
                }
              </div>
            </div>
          </div>
        </div>

        {availableUpgrades.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Available Upgrades</h3>
            <div className="space-y-3">
              {availableUpgrades.map(upgrade => (
                <motion.div
                  key={upgrade.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-gray-800">{upgrade.name}</div>
                      <div className="text-sm text-gray-500 mb-2">{upgrade.description}</div>
                      <div className="flex flex-wrap gap-2">
                        {upgrade.effects.efficiency > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            +{upgrade.effects.efficiency}% Efficiency
                          </span>
                        )}
                        {upgrade.effects.communitySatisfaction > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            +{upgrade.effects.communitySatisfaction} Community Satisfaction
                          </span>
                        )}
                        {upgrade.effects.pollution && upgrade.effects.pollution < 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800">
                            {upgrade.effects.pollution}% Pollution
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">{upgrade.cost}c</div>
                      <div className="text-sm text-gray-500">{upgrade.maintenanceCost}c/day maintenance</div>
                      <button
                        onClick={() => onPurchaseInfrastructureUpgrade(upgrade.id)}
                        disabled={coins < upgrade.cost}
                        className={`mt-2 px-4 py-2 rounded-lg text-sm font-medium ${
                          coins >= upgrade.cost
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Purchase
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Build time: {upgrade.buildTime} days
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {completedUpgrades.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Active Infrastructure</h3>
            <div className="space-y-2">
              {completedUpgrades.map(upgrade => (
                <div key={upgrade.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-600 mr-2" size={16} />
                    <div>
                      <div className="font-medium text-green-800">{upgrade.name}</div>
                      <div className="text-sm text-green-700">
                        Maintenance: {upgrade.maintenanceCost}c/day
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
            <span className="font-medium">{currentBudgetSystem.buildingIncome}c</span>
          </div>
          <div className="flex justify-between">
            <span>Tax Revenue</span>
            <span className="font-medium">{currentBudgetSystem.taxRevenue}c</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold">
            <span>Total Revenue</span>
            <span>{currentBudgetSystem.totalBudget}c</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-3 flex items-center">
          <BarChart3 className="mr-2" size={20} />
          Service Effects
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {serviceEffects.communitySatisfaction !== 0 && (
            <div className={`text-center p-3 rounded-lg ${
              serviceEffects.communitySatisfaction > 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className={`text-lg font-bold ${
                serviceEffects.communitySatisfaction > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {serviceEffects.communitySatisfaction > 0 ? '+' : ''}{Math.round(serviceEffects.communitySatisfaction)}
              </div>
              <div className="text-sm text-gray-600">Community Satisfaction</div>
            </div>
          )}
          {serviceEffects.pollution !== 0 && (
            <div className={`text-center p-3 rounded-lg ${
              serviceEffects.pollution < 0 ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className={`text-lg font-bold ${
                serviceEffects.pollution < 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.round(serviceEffects.pollution)}%
              </div>
              <div className="text-sm text-gray-600">Pollution</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-3">Budget Health Analysis</h3>
        <div className="space-y-3">
          <div className={`p-3 rounded-lg ${
            currentBudgetSystem.budgetSurplus >= 100 ? 'bg-green-50' :
            currentBudgetSystem.budgetSurplus >= 0 ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center">
              {currentBudgetSystem.budgetSurplus >= 100 ? (
                <CheckCircle className="text-green-600 mr-2" size={20} />
              ) : currentBudgetSystem.budgetSurplus >= 0 ? (
                <Info className="text-yellow-600 mr-2" size={20} />
              ) : (
                <AlertTriangle className="text-red-600 mr-2" size={20} />
              )}
              <div>
                <div className={`font-medium ${
                  currentBudgetSystem.budgetSurplus >= 100 ? 'text-green-800' :
                  currentBudgetSystem.budgetSurplus >= 0 ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {currentBudgetSystem.budgetSurplus >= 100 ? 'Excellent Budget Health' :
                   currentBudgetSystem.budgetSurplus >= 0 ? 'Stable Budget' : 'Budget Deficit'}
                </div>
                <div className={`text-sm ${
                  currentBudgetSystem.budgetSurplus >= 100 ? 'text-green-700' :
                  currentBudgetSystem.budgetSurplus >= 0 ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {currentBudgetSystem.budgetSurplus >= 100 ? 
                    'Your city is financially strong with room for expansion' :
                   currentBudgetSystem.budgetSurplus >= 0 ? 
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
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium flex items-center">
            <DollarSign size={20} className="mr-2" />
            Budget Management
          </h2>
          <button onClick={onClose} className="text-white hover:text-blue-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          {[
            { id: 'budget', label: 'Service Budgets', icon: Settings },
            { id: 'taxes', label: 'Tax Policies', icon: DollarSign },
            { id: 'infrastructure', label: 'Infrastructure', icon: Wrench },
            { id: 'analysis', label: 'Analysis', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center space-x-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {activeTab === 'budget' && renderBudgetTab()}
          {activeTab === 'taxes' && renderTaxesTab()}
          {activeTab === 'infrastructure' && renderInfrastructureTab()}
          {activeTab === 'analysis' && renderAnalysisTab()}
        </div>
      </motion.div>
    </motion.div>
  );
}