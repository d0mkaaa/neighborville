import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShoppingCart, Package, TrendingUp, Clock, Star, 
  Coins, Users, Filter, Search, RefreshCw, AlertCircle,
  Award, Zap, Shield, Heart, Home, Sparkles, Timer,
  ChevronDown, ChevronUp, ExternalLink, Gift, Crown
} from 'lucide-react';
import type { GameProgress } from '../../types/game';
import type { Neighbor } from '../../types/game';

export type MarketItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  sellerType: 'resident' | 'system' | 'traveling_merchant' | 'premium' | 'seasonal';
  sellerId?: string | number;
  itemType: 'material' | 'service' | 'rare' | 'building_upgrade' | 'boost' | 'decoration' | 'blueprint' | 'special';
  quantity: number;
  icon: string;
  availableUntil?: number;
  effect?: string;
  duration?: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  category?: 'resources' | 'buildings' | 'boosts' | 'decorations' | 'special';
  requirements?: {
    level?: number;
    buildings?: string[];
    achievements?: string[];
  };
  discount?: number;
  trending?: boolean;
  featured?: boolean;
  limited?: boolean;
  dailyDeal?: boolean;
};

type MarketplaceProps = {
  neighbors: Neighbor[];
  coins: number;
  day: number;
  onClose: () => void;
  onPurchase: (item: MarketItem) => void;
  onSellItem: (itemId: string, price: number) => void;
  onUpdateGameState: (updates: Partial<GameProgress>) => void;
  grid: (any | null)[];
  playerLevel: number;
  gameProgress: GameProgress;
};

export default function Marketplace({ 
  neighbors, 
  coins, 
  day, 
  onClose, 
  onPurchase, 
  onSellItem,
  onUpdateGameState,
  grid,
  playerLevel,
  gameProgress
}: MarketplaceProps) {
  const [activeTab, setActiveTab] = useState<'featured' | 'browse' | 'sell' | 'history'>('featured');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price' | 'rarity' | 'popularity' | 'newest'>('popularity');
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [inventory, setInventory] = useState<MarketItem[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [refreshCooldown, setRefreshCooldown] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

  useEffect(() => {
    generateMarketItems();
    loadInventory();
    loadPurchaseHistory();
  }, [day, playerLevel]);

  useEffect(() => {
    if (refreshCooldown > 0) {
      const timer = setTimeout(() => setRefreshCooldown(refreshCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [refreshCooldown]);

  const loadInventory = () => {
    const savedInventory = localStorage.getItem('neighborville_inventory');
    if (savedInventory) {
      setInventory(JSON.parse(savedInventory));
    }
  };

  const saveInventory = (newInventory: MarketItem[]) => {
    localStorage.setItem('neighborville_inventory', JSON.stringify(newInventory));
    setInventory(newInventory);
  };

  const loadPurchaseHistory = () => {
    const savedHistory = localStorage.getItem('neighborville_market_history');
    if (savedHistory) {
      setPurchaseHistory(JSON.parse(savedHistory));
    }
  };

  const generateMarketItems = () => {
    const baseItems: MarketItem[] = [
      {
        id: 'golden_hammer',
        name: 'Golden Hammer',
        description: 'Reduces all building construction time by 50% for 7 days',
        price: 2500,
        sellerType: 'premium',
        itemType: 'boost',
        quantity: 1,
        icon: '🔨',
        rarity: 'legendary',
        category: 'boosts',
        effect: 'construction_speed_boost',
        duration: 7,
        featured: true,
        requirements: { level: 10 }
      },
      {
        id: 'rainbow_fountain',
        name: 'Rainbow Fountain',
        description: 'Beautiful centerpiece that boosts happiness of all residents by +15',
        price: 5000,
        sellerType: 'premium',
        itemType: 'decoration',
        quantity: 1,
        icon: '⛲',
        rarity: 'epic',
        category: 'decorations',
        effect: 'happiness_boost',
        featured: true,
        requirements: { level: 15 }
      },
      
      {
        id: 'wood_bundle_xl',
        name: 'Premium Wood Bundle',
        description: 'High-quality wood perfect for construction projects',
        price: 800,
        sellerType: 'system',
        itemType: 'material',
        quantity: 50,
        icon: '🪵',
        rarity: 'uncommon',
        category: 'resources',
        dailyDeal: true,
        discount: 25
      },
      {
        id: 'stone_collection',
        name: 'Architect\'s Stone Collection',
        description: 'Premium stones for your finest buildings',
        price: 1200,
        sellerType: 'system',
        itemType: 'material',
        quantity: 35,
        icon: '🪨',
        rarity: 'rare',
        category: 'resources',
        dailyDeal: true,
        discount: 30
      },

      {
        id: 'solar_panel_kit',
        name: 'Solar Panel Upgrade Kit',
        description: 'Upgrade any building to generate clean energy and reduce bills',
        price: 3000,
        sellerType: 'system',
        itemType: 'building_upgrade',
        quantity: 1,
        icon: '☀️',
        rarity: 'epic',
        category: 'buildings',
        trending: true,
        requirements: { level: 12 }
      },
      {
        id: 'community_garden_blueprint',
        name: 'Community Garden Blueprint',
        description: 'Build a beautiful garden that generates food and happiness',
        price: 1800,
        sellerType: 'system',
        itemType: 'blueprint',
        quantity: 1,
        icon: '🌻',
        rarity: 'rare',
        category: 'buildings',
        trending: true,
        requirements: { level: 8 }
      },

      ...neighbors.slice(0, 3).map((neighbor, index) => ({
        id: `neighbor_item_${neighbor.id}_${day}`,
        name: `${neighbor.name}'s Special Craft`,
        description: `A unique item crafted by ${neighbor.name} with love`,
        price: 300 + (index * 150),
        sellerType: 'resident' as const,
        sellerId: neighbor.id,
        itemType: 'decoration' as const,
        quantity: 1,
        icon: ['🎨', '🧸', '🏺', '🕯️', '🖼️'][index % 5],
        rarity: 'uncommon' as const,
        category: 'decorations' as const
      })),

      {
        id: 'winter_wonderland_pack',
        name: 'Winter Wonderland Pack',
        description: 'Transform your city with beautiful winter decorations',
        price: 4500,
        sellerType: 'seasonal',
        itemType: 'special',
        quantity: 1,
        icon: '❄️',
        rarity: 'legendary',
        category: 'special',
        limited: true,
        availableUntil: Date.now() + (7 * 24 * 60 * 60 * 1000)
      },

      {
        id: 'iron_ore_small',
        name: 'Iron Ore',
        description: 'Essential material for advanced construction',
        price: 150,
        sellerType: 'system',
        itemType: 'material',
        quantity: 10,
        icon: '⛏️',
        rarity: 'common',
        category: 'resources'
      },
      {
        id: 'energy_cell',
        name: 'Energy Cell',
        description: 'Provides instant energy to power your buildings',
        price: 400,
        sellerType: 'system',
        itemType: 'boost',
        quantity: 5,
        icon: '🔋',
        rarity: 'uncommon',
        category: 'boosts'
      }
    ];

    const availableItems = baseItems.filter(item => {
      if (item.requirements?.level && playerLevel < item.requirements.level) {
        return false;
      }
      return true;
    });

    setMarketItems(availableItems);
  };

  const handleRefreshMarket = () => {
    if (refreshCooldown > 0) return;
    
    generateMarketItems();
    setRefreshCooldown(30);
  };

  const getItemRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'uncommon': return 'text-green-600 bg-green-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'material': return <Package className="w-4 h-4" />;
      case 'boost': return <Zap className="w-4 h-4" />;
      case 'decoration': return <Sparkles className="w-4 h-4" />;
      case 'building_upgrade': return <Home className="w-4 h-4" />;
      case 'blueprint': return <Award className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const handlePurchaseItem = (item: MarketItem) => {
    if (coins < item.price) {
      return;
    }

    const purchase = {
      id: Date.now().toString(),
      item: item,
      purchaseDate: new Date().toISOString(),
      price: item.price
    };
    
    const newHistory = [purchase, ...purchaseHistory].slice(0, 50);
    localStorage.setItem('neighborville_market_history', JSON.stringify(newHistory));
    setPurchaseHistory(newHistory);

    applyItemEffect(item);
    
    onPurchase(item);
  };

  const applyItemEffect = (item: MarketItem) => {
    switch (item.effect) {
      case 'construction_speed_boost':
        break;
      case 'happiness_boost':
        break;
    }
  };

  const filteredItems = marketItems.filter(item => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rarity':
        const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
        return (rarityOrder[b.rarity || 'common'] || 1) - (rarityOrder[a.rarity || 'common'] || 1);
      case 'newest':
        return b.id.localeCompare(a.id);
      default:
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    }
  });

  const featuredItems = marketItems.filter(item => item.featured || item.dailyDeal || item.trending);

  const renderItemCard = (item: MarketItem, compact = false) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white rounded-xl shadow-lg border-2 border-transparent hover:border-blue-200 transition-all duration-200 overflow-hidden ${compact ? 'p-3' : 'p-4'} cursor-pointer`}
      onClick={() => setSelectedItem(item)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap gap-1">
          {item.featured && (
            <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Crown className="w-3 h-3" />
              FEATURED
            </span>
          )}
          {item.dailyDeal && (
            <span className="px-2 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Timer className="w-3 h-3" />
              DAILY DEAL
            </span>
          )}
          {item.trending && (
            <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              TRENDING
            </span>
          )}
          {item.limited && (
            <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold rounded-full">
              LIMITED
            </span>
          )}
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getItemRarityColor(item.rarity)}`}>
          {item.rarity?.toUpperCase()}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl">{item.icon}</div>
        <div className="flex-1">
          <h3 className={`font-bold text-gray-800 ${compact ? 'text-sm' : 'text-base'}`}>
            {item.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {getItemTypeIcon(item.itemType)}
            <span className="text-xs text-gray-500 capitalize">{item.itemType.replace('_', ' ')}</span>
            {item.quantity > 1 && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                x{item.quantity}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className={`text-gray-600 mb-3 ${compact ? 'text-xs' : 'text-sm'}`}>
        {item.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className={`font-bold text-gray-800 ${item.discount ? 'line-through text-gray-400' : ''}`}>
              {item.price}
            </span>
            {item.discount && (
              <span className="font-bold text-green-600">
                {Math.floor(item.price * (1 - item.discount / 100))}
              </span>
            )}
          </div>
          {item.discount && (
            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">
              -{item.discount}%
            </span>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePurchaseItem(item);
          }}
          disabled={coins < (item.discount ? Math.floor(item.price * (1 - item.discount / 100)) : item.price)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
            coins >= (item.discount ? Math.floor(item.price * (1 - item.discount / 100)) : item.price)
              ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {coins >= (item.discount ? Math.floor(item.price * (1 - item.discount / 100)) : item.price) ? 'Buy Now' : 'Not Enough Coins'}
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>
            {item.sellerType === 'resident' && neighbors.find(n => n.id === item.sellerId)
              ? neighbors.find(n => n.id === item.sellerId)!.name
              : item.sellerType === 'system' 
                ? 'NeighborVille Store'
                : item.sellerType === 'premium'
                  ? 'Premium Shop'
                  : 'Special Vendor'
            }
          </span>
        </div>
        {item.availableUntil && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>
              {Math.ceil((item.availableUntil - Date.now()) / (1000 * 60 * 60 * 24))} days left
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">NeighborVille Marketplace</h1>
                <p className="text-blue-100">Discover amazing items for your city</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                <Coins className="w-5 h-5 text-yellow-300" />
                <span className="font-bold text-lg">{coins.toLocaleString()}</span>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            {[
              { id: 'featured', label: 'Featured', icon: Star },
              { id: 'browse', label: 'Browse All', icon: Search },
              { id: 'sell', label: 'Sell Items', icon: Package },
              { id: 'history', label: 'Purchase History', icon: Clock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 h-full overflow-y-auto">
          {activeTab === 'featured' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Featured Items</h2>
                <button
                  onClick={handleRefreshMarket}
                  disabled={refreshCooldown > 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    refreshCooldown > 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshCooldown > 0 ? 'animate-spin' : ''}`} />
                  {refreshCooldown > 0 ? `Refresh in ${refreshCooldown}s` : 'Refresh Market'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {featuredItems.map(item => renderItemCard(item))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {activeTab === 'browse' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="resources">Resources</option>
                    <option value="buildings">Buildings</option>
                    <option value="boosts">Boosts</option>
                    <option value="decorations">Decorations</option>
                    <option value="special">Special</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="popularity">Most Popular</option>
                    <option value="price">Price: Low to High</option>
                    <option value="rarity">Rarity: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {filteredItems.map(item => renderItemCard(item, true))}
                </AnimatePresence>
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No items found</h3>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sell' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">Selling Feature Coming Soon!</h3>
                <p className="text-gray-400">
                  Soon you'll be able to sell your extra items and resources to other players.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {purchaseHistory.length === 0 ? (
                <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No purchases yet</h3>
                  <p className="text-gray-400">Your purchase history will appear here</p>
                </div>
              ) : (
                purchaseHistory.map((purchase, index) => (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4"
                  >
                    <div className="text-2xl">{purchase.item.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{purchase.item.name}</h3>
                      <p className="text-sm text-gray-500">
                        Purchased on {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Coins className="w-4 h-4" />
                      <span className="font-medium">{purchase.price}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">{selectedItem.name}</h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{selectedItem.icon}</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getItemRarityColor(selectedItem.rarity)}`}>
                  {selectedItem.rarity?.toUpperCase()}
                </div>
              </div>

              <p className="text-gray-600 mb-6">{selectedItem.description}</p>

              {selectedItem.effect && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Special Effect</span>
                  </div>
                  <p className="text-sm text-blue-700">{selectedItem.effect.replace('_', ' ')}</p>
                  {selectedItem.duration && (
                    <p className="text-xs text-blue-600 mt-1">Duration: {selectedItem.duration} days</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-800">
                    {selectedItem.discount 
                      ? Math.floor(selectedItem.price * (1 - selectedItem.discount / 100))
                      : selectedItem.price
                    }
                  </span>
                  {selectedItem.discount && (
                    <span className="text-lg text-gray-400 line-through">{selectedItem.price}</span>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    handlePurchaseItem(selectedItem);
                    setSelectedItem(null);
                  }}
                  disabled={coins < (selectedItem.discount ? Math.floor(selectedItem.price * (1 - selectedItem.discount / 100)) : selectedItem.price)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    coins >= (selectedItem.discount ? Math.floor(selectedItem.price * (1 - selectedItem.discount / 100)) : selectedItem.price)
                      ? 'bg-blue-500 hover:bg-blue-600 text-white hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {coins >= (selectedItem.discount ? Math.floor(selectedItem.price * (1 - selectedItem.discount / 100)) : selectedItem.price) ? 'Purchase' : 'Not Enough Coins'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}