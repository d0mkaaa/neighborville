import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ship, Truck, TrendingUp, TrendingDown, X, Plus, MapPin, Clock, Star, Package } from 'lucide-react';
import { TRADE_ROUTES } from '../../data/gameEvents';
import type { TradeRoute, TradeGood } from '../../data/gameEvents';

interface TradeSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  currentDay: number;
  playerLevel: number;
  cityReputation: number;
  activeTrades: { routeId: string; goodId: string; quantity: number; departureDay: number }[];
  inventory: { goodId: string; quantity: number }[];
  onStartTrade: (routeId: string, goodId: string, quantity: number, cost: number) => void;
  onCompleteTrade: (tradeId: string, profit: number) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function TradeSystemModal({
  isOpen,
  onClose,
  coins,
  currentDay,
  playerLevel,
  cityReputation,
  activeTrades,
  inventory,
  onStartTrade,
  onCompleteTrade,
  addNotification
}: TradeSystemModalProps) {
  const [selectedTab, setSelectedTab] = useState('routes');
  const [selectedRoute, setSelectedRoute] = useState<TradeRoute | null>(null);
  const [tradeRoutes, setTradeRoutes] = useState<TradeRoute[]>(TRADE_ROUTES);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [marketTrends, setMarketTrends] = useState<Record<string, number>>({});
  useEffect(() => {
    const updateMarketTrends = () => {
      const trends: Record<string, number> = {};
      tradeRoutes.forEach(route => {
        route.goods.forEach(good => {
          const fluctuation = (Math.random() - 0.4) * 0.5;
          trends[good.id] = fluctuation;
        });
      });
      setMarketTrends(trends);
    };

    updateMarketTrends();
  }, [currentDay, tradeRoutes]);
  useEffect(() => {
    activeTrades.forEach(trade => {
      const route = tradeRoutes.find(r => r.id === trade.routeId);
      if (route && currentDay >= trade.departureDay + route.travelTime) {
        const good = route.goods.find(g => g.id === trade.goodId);
        if (good) {
          const basePrice = good.basePrice * good.demand;
          const marketTrend = marketTrends[good.id] || 0;
          const finalPrice = basePrice * (1 + marketTrend);
          const profit = (finalPrice - good.basePrice) * trade.quantity;
          
          onCompleteTrade(`${trade.routeId}_${trade.goodId}_${trade.departureDay}`, profit);
          addNotification(
            `Trade completed! Earned ${Math.round(profit)} coins from ${good.name}`,
            profit > 0 ? 'success' : 'warning'
          );
        }
      }
    });
  }, [currentDay, activeTrades, tradeRoutes, marketTrends, onCompleteTrade, addNotification]);

  const getAvailableRoutes = () => {
    return tradeRoutes.filter(route => {
      if (route.id === 'metropolis') return playerLevel >= 3;
      if (route.id === 'industrial_zone') return playerLevel >= 5;
      if (route.id === 'tech_city') return playerLevel >= 7;
      return true;
    });
  };

  const calculateTradeProfit = (good: TradeGood, quantity: number, isSelling: boolean): number => {
    const marketTrend = marketTrends[good.id] || 0;
    const trendMultiplier = 1 + marketTrend;
    
    if (isSelling) {
      return Math.round((good.basePrice * good.demand * trendMultiplier) * quantity);
    } else {
      return Math.round(good.basePrice * quantity);
    }
  };

  const handleStartTrade = (route: TradeRoute, good: TradeGood, isSelling: boolean) => {
    const cost = isSelling ? 0 : calculateTradeProfit(good, selectedQuantity, false);
    
    if (!isSelling && cost > coins) {
      addNotification('Not enough coins for this trade!', 'error');
      return;
    }

    if (isSelling) {
      const inventoryItem = inventory.find(item => item.goodId === good.id);
      if (!inventoryItem || inventoryItem.quantity < selectedQuantity) {
        addNotification('Not enough inventory for this trade!', 'error');
        return;
      }
    }

    onStartTrade(route.id, good.id, selectedQuantity, cost);
    addNotification(
      `Trade started! ${isSelling ? 'Selling' : 'Buying'} ${selectedQuantity} ${good.name}`,
      'info'
    );
    setSelectedQuantity(1);
  };

  const getRelationshipColor = (relationship: number) => {
    if (relationship >= 80) return 'text-emerald-600 bg-emerald-50';
    if (relationship >= 60) return 'text-blue-600 bg-blue-50';
    if (relationship >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getRelationshipLabel = (relationship: number) => {
    if (relationship >= 80) return 'Excellent';
    if (relationship >= 60) return 'Good';
    if (relationship >= 40) return 'Fair';
    return 'Poor';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0.1) return <TrendingUp className="text-emerald-500" size={16} />;
    if (trend < -0.1) return <TrendingDown className="text-red-500" size={16} />;
    return <span className="text-gray-400">→</span>;
  };

  const getInventoryQuantity = (goodId: string) => {
    const item = inventory.find(i => i.goodId === goodId);
    return item ? item.quantity : 0;
  };

  if (!isOpen) return null;

  const availableRoutes = getAvailableRoutes();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Ship size={24} className="mr-3" />
              <div>
                <h2 className="text-xl font-bold">Trade Center</h2>
                <p className="text-blue-100 text-sm">
                  Build relationships and expand your economy
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{coins}</div>
              <div className="text-xs text-blue-100">Available Coins</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{activeTrades.length}</div>
              <div className="text-xs text-blue-100">Active Trades</div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 text-center">
              <div className="text-lg font-bold">{cityReputation}</div>
              <div className="text-xs text-blue-100">City Reputation</div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-200px)]">
          <div className="w-64 bg-gray-50 border-r p-4">
            <div className="space-y-1">
              {[
                { id: 'routes', name: 'Trade Routes', icon: '🛣️' },
                { id: 'active', name: 'Active Trades', icon: '📦' },
                { id: 'inventory', name: 'Inventory', icon: '📋' },
                { id: 'market', name: 'Market Trends', icon: '📈' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {selectedTab === 'routes' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Available Trade Routes</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {availableRoutes.map(route => (
                    <motion.div
                      key={route.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white border rounded-lg p-4 shadow-sm cursor-pointer"
                      onClick={() => setSelectedRoute(route)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <MapPin className="text-blue-500 mr-2" size={20} />
                          <h4 className="font-bold text-gray-800">{route.destination}</h4>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getRelationshipColor(route.relationship)}`}>
                          {getRelationshipLabel(route.relationship)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Truck size={16} className="mr-1" />
                          {route.distance}km
                        </div>
                        <div className="flex items-center">
                          <Clock size={16} className="mr-1" />
                          {route.travelTime} days
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-700">Available Goods:</div>
                        <div className="flex flex-wrap gap-1">
                          {route.goods.map(good => (
                            <span
                              key={good.id}
                              className="px-2 py-1 bg-gray-100 rounded text-xs"
                            >
                              {good.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedRoute && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                      onClick={() => setSelectedRoute(null)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold">Trade with {selectedRoute.destination}</h3>
                          <button onClick={() => setSelectedRoute(null)}>
                            <X size={20} />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {selectedRoute.goods.map(good => (
                            <div key={good.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-medium">{good.name}</h4>
                                  <p className="text-sm text-gray-600">{good.category}</p>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold">{good.basePrice} coins</div>
                                  <div className="text-sm text-gray-600">Base Price</div>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-600">{good.demand.toFixed(1)}x</div>
                                  <div className="text-xs text-gray-600">Demand</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-emerald-600">{good.supply}</div>
                                  <div className="text-xs text-gray-600">Supply</div>
                                </div>
                                <div className="text-center flex items-center justify-center">
                                  {getTrendIcon(marketTrends[good.id] || 0)}
                                  <span className="ml-1 text-sm">Trend</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div>
                                  <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={selectedQuantity}
                                    onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-20 px-2 py-1 border rounded"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleStartTrade(selectedRoute, good, false)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    disabled={coins < calculateTradeProfit(good, selectedQuantity, false)}
                                  >
                                    Buy ({calculateTradeProfit(good, selectedQuantity, false)} coins)
                                  </button>
                                  <button
                                    onClick={() => handleStartTrade(selectedRoute, good, true)}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                                    disabled={getInventoryQuantity(good.id) < selectedQuantity}
                                  >
                                    Sell ({calculateTradeProfit(good, selectedQuantity, true)} coins)
                                  </button>
                                </div>
                              </div>

                              <div className="mt-2 text-sm text-gray-600">
                                Inventory: {getInventoryQuantity(good.id)} units
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {selectedTab === 'active' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Active Trades</h3>
                
                {activeTrades.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No active trades</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeTrades.map((trade, index) => {
                      const route = tradeRoutes.find(r => r.id === trade.routeId);
                      const good = route?.goods.find(g => g.id === trade.goodId);
                      const daysRemaining = Math.max(0, (trade.departureDay + (route?.travelTime || 0)) - currentDay);
                      
                      return (
                        <div key={index} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{good?.name} to {route?.destination}</h4>
                              <p className="text-sm text-gray-600">Quantity: {trade.quantity}</p>
                            </div>
                            <div className="text-right">
                              {daysRemaining > 0 ? (
                                <div className="text-amber-600 font-medium">
                                  {daysRemaining} days remaining
                                </div>
                              ) : (
                                <div className="text-emerald-600 font-medium">
                                  Ready to collect!
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'inventory' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Trade Inventory</h3>
                
                {inventory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No items in inventory</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inventory.map((item, index) => {
                      const goodInfo = tradeRoutes
                        .flatMap(r => r.goods)
                        .find(g => g.id === item.goodId);
                      
                      return (
                        <div key={index} className="bg-white border rounded-lg p-4">
                          <h4 className="font-medium mb-2">{goodInfo?.name || item.goodId}</h4>
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {item.quantity}
                          </div>
                          <div className="text-sm text-gray-600">
                            Value: {((goodInfo?.basePrice || 0) * item.quantity).toLocaleString()} coins
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'market' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Market Trends</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tradeRoutes.flatMap(route => 
                    route.goods.map(good => ({
                      ...good,
                      trend: marketTrends[good.id] || 0,
                      destination: route.destination
                    }))
                  ).map((good, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{good.name}</h4>
                        <div className="flex items-center">
                          {getTrendIcon(good.trend)}
                          <span className={`ml-1 text-sm font-medium ${
                            good.trend > 0 ? 'text-emerald-600' : 
                            good.trend < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {good.trend > 0 ? '+' : ''}{(good.trend * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {good.destination} • {good.category}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Base: {good.basePrice} coins</span>
                        <span className="font-medium">
                          Current: {Math.round(good.basePrice * (1 + good.trend))} coins
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 