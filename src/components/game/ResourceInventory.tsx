import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, TrendingUp, TrendingDown, Search, Filter } from 'lucide-react';
import { RESOURCES, type Resource, getResourceById } from '../../data/resources';

interface ResourceInventoryProps {
  playerResources: { [resourceId: string]: number };
  onResourceUpdate?: (resourceId: string, quantity: number) => void;
  onSellResource?: (resourceId: string, quantity: number) => void;
  onBuyResource?: (resourceId: string, quantity: number) => void;
  coins?: number;
  showTrading?: boolean;
  productionStats?: any;
}

export default function ResourceInventory({
  playerResources,
  onResourceUpdate,
  onSellResource,
  onBuyResource,
  coins = 0,
  showTrading = false,
  productionStats
}: ResourceInventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'value'>('name');

  const allResources = RESOURCES.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || resource.category === filterCategory;
    return matchesSearch && matchesCategory;  });

  const sortedResources = [...allResources].sort((a, b) => {
    switch (sortBy) {
      case 'quantity':
        return (playerResources[b.id] || 0) - (playerResources[a.id] || 0);
      case 'value':
        return b.baseValue - a.baseValue;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const getTotalInventoryValue = (): number => {
    return Object.entries(playerResources).reduce((total, [resourceId, quantity]) => {
      const resource = getResourceById(resourceId);
      return total + (resource ? resource.baseValue * quantity : 0);
    }, 0);
  };

  const getRarityColor = (rarity: Resource['rarity']): string => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'uncommon': return 'text-green-600 bg-green-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const categories = ['all', 'raw', 'processed', 'refined', 'component', 'luxury'];

  return (
    <div className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl shadow-xl">
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
              <Package className="text-blue-600" size={20} />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Resource Inventory</h3>
          </div>
          <div className="text-sm text-gray-700 bg-gradient-to-r from-green-100 to-green-200 px-3 py-1 rounded-full">
            Total Value: <span className="font-bold text-green-700">{getTotalInventoryValue()} coins</span>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-gray-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 items-center">
          <span className="text-sm text-gray-700 font-medium">Sort by:</span>
          {(['name', 'quantity', 'value'] as const).map(option => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                sortBy === option
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white/30 text-gray-700 hover:bg-white/50'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto p-6">
        {sortedResources.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <div className="w-16 h-16 bg-gray-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium">No resources found</p>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sortedResources.map(resource => {
              const quantity = playerResources[resource.id] || 0;
              const totalValue = quantity * resource.baseValue;
              
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{resource.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800">{resource.name}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRarityColor(resource.rarity)}`}>
                            {resource.rarity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1">{resource.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm font-medium text-blue-600">
                            Qty: {quantity}
                          </span>
                          <span className="text-sm text-gray-500">
                            Value: {resource.baseValue} coins each
                          </span>
                          {quantity > 0 && (
                            <span className="text-sm font-medium text-green-600">
                              Total: {totalValue} coins
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {showTrading && quantity > 0 && onSellResource && (
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onSellResource(resource.id, 1)}
                          className="px-3 py-1 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg text-xs font-medium hover:from-red-500 hover:to-red-600 transition-all shadow-sm"
                          title={`Sell 1 ${resource.name} for ${resource.baseValue} coins`}
                        >
                          <TrendingDown size={12} className="inline mr-1" />
                          Sell 1
                        </motion.button>
                        {quantity >= 5 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onSellResource(resource.id, 5)}
                            className="px-3 py-1 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-lg text-xs font-medium hover:from-red-500 hover:to-red-600 transition-all shadow-sm"
                            title={`Sell 5 ${resource.name} for ${resource.baseValue * 5} coins`}
                          >
                            Sell 5
                          </motion.button>
                        )}
                      </div>
                    )}

                    {showTrading && onBuyResource && coins >= resource.baseValue && (
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onBuyResource(resource.id, 1)}
                          className="px-3 py-1 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg text-xs font-medium hover:from-green-500 hover:to-green-600 transition-all shadow-sm"
                          title={`Buy 1 ${resource.name} for ${resource.baseValue} coins`}
                        >
                          <TrendingUp size={12} className="inline mr-1" />
                          Buy 1
                        </motion.button>
                        {coins >= resource.baseValue * 5 && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onBuyResource(resource.id, 5)}
                            className="px-3 py-1 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-lg text-xs font-medium hover:from-green-500 hover:to-green-600 transition-all shadow-sm"
                            title={`Buy 5 ${resource.name} for ${resource.baseValue * 5} coins`}
                          >
                            Buy 5
                          </motion.button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/20 bg-gradient-to-r from-blue-50/30 to-purple-50/30 backdrop-blur-sm rounded-b-2xl">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {Object.keys(playerResources).filter(id => playerResources[id] > 0).length}
            </div>
            <div className="text-xs text-gray-700 font-medium">Resource Types</div>
          </div>
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              {Object.values(playerResources).reduce((sum, qty) => sum + qty, 0)}
            </div>
            <div className="text-xs text-gray-700 font-medium">Total Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              {getTotalInventoryValue()}
            </div>
            <div className="text-xs text-gray-700 font-medium">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  );
}
