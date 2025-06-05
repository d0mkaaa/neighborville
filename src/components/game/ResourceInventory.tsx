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
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="text-blue-600" size={20} />
            <h3 className="font-medium text-gray-800">Resource Inventory</h3>
          </div>
          <div className="text-sm text-gray-600">
            Total Value: <span className="font-medium text-green-600">{getTotalInventoryValue()} coins</span>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          {(['name', 'quantity', 'value'] as const).map(option => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-2 py-1 rounded text-xs font-medium ${
                sortBy === option
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto p-4">
        {sortedResources.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Package size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No resources found</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {sortedResources.map(resource => {
              const quantity = playerResources[resource.id] || 0;
              const totalValue = quantity * resource.baseValue;
              
              return (
                <motion.div
                  key={resource.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
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
                        <button
                          onClick={() => onSellResource(resource.id, 1)}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                          title={`Sell 1 ${resource.name} for ${resource.baseValue} coins`}
                        >
                          <TrendingDown size={12} className="inline mr-1" />
                          Sell 1
                        </button>
                        {quantity >= 5 && (
                          <button
                            onClick={() => onSellResource(resource.id, 5)}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                            title={`Sell 5 ${resource.name} for ${resource.baseValue * 5} coins`}
                          >
                            Sell 5
                          </button>
                        )}
                      </div>
                    )}

                    {showTrading && onBuyResource && coins >= resource.baseValue && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onBuyResource(resource.id, 1)}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                          title={`Buy 1 ${resource.name} for ${resource.baseValue} coins`}
                        >
                          <TrendingUp size={12} className="inline mr-1" />
                          Buy 1
                        </button>
                        {coins >= resource.baseValue * 5 && (
                          <button
                            onClick={() => onBuyResource(resource.id, 5)}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                            title={`Buy 5 ${resource.name} for ${resource.baseValue * 5} coins`}
                          >
                            Buy 5
                          </button>
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

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">
              {Object.keys(playerResources).filter(id => playerResources[id] > 0).length}
            </div>
            <div className="text-xs text-gray-600">Resource Types</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {Object.values(playerResources).reduce((sum, qty) => sum + qty, 0)}
            </div>
            <div className="text-xs text-gray-600">Total Items</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600">
              {getTotalInventoryValue()}
            </div>
            <div className="text-xs text-gray-600">Total Value</div>
          </div>
        </div>
      </div>
    </div>
  );
}
