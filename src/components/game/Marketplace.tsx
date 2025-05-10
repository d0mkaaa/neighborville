import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Store, ShoppingCart, TrendingUp, RefreshCw, Coins } from "lucide-react";
import type { Neighbor, Building } from "../../types/game";

type MarketItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  sellerType: 'resident' | 'system';
  sellerId?: number;
  itemType: 'material' | 'service' | 'rare' | 'building_upgrade';
  quantity: number;
  icon: string;
  availableUntil?: number;
};

type MarketplaceProps = {
  neighbors: Neighbor[];
  coins: number;
  day: number;
  onClose: () => void;
  onPurchase: (item: MarketItem) => void;
  onSellItem: (itemId: string, price: number) => void;
  grid: (Building | null)[];
};

export default function Marketplace({ neighbors, coins, day, onClose, onPurchase, onSellItem, grid }: MarketplaceProps) {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'history'>('buy');
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [refreshCost, setRefreshCost] = useState(50);
  const [lastRefresh, setLastRefresh] = useState(day);
  
  useEffect(() => {
    generateMarketItems();
  }, [day]);
  
  const generateMarketItems = () => {
    const items: MarketItem[] = [];
    
    const systemItems: MarketItem[] = [
      {
        id: 'premium_paint',
        name: 'Premium Paint',
        description: 'Increase building happiness bonus by 5%',
        price: 150,
        sellerType: 'system',
        itemType: 'building_upgrade',
        quantity: 5,
        icon: '🎨'
      },
      {
        id: 'energy_booster',
        name: 'Energy Booster',
        description: 'Reduce energy consumption for 3 days',
        price: 200,
        sellerType: 'system',
        itemType: 'service',
        quantity: 1,
        icon: '⚡'
      },
      {
        id: 'construction_materials',
        name: 'Construction Materials',
        description: 'Reduce building costs by 10% for 5 buildings',
        price: 300,
        sellerType: 'system',
        itemType: 'material',
        quantity: 3,
        icon: '🔨'
      },
      {
        id: 'happiness_charm',
        name: 'Happiness Charm',
        description: 'Increase overall neighborhood happiness by 10%',
        price: 400,
        sellerType: 'system',
        itemType: 'rare',
        quantity: 1,
        icon: '✨'
      }
    ];
    
    items.push(...systemItems);
    
    const activeResidents = neighbors.filter(n => n.hasHome);
    activeResidents.forEach(resident => {
      if (Math.random() < 0.3) {
        const priceMultiplier = 0.7 + Math.random() * 0.6;
        const residentItems: MarketItem[] = [
          {
            id: `${resident.id}_handmade_craft`,
            name: 'Handmade Craft',
            description: `Unique decoration from ${resident.name}`,
            price: Math.floor(80 * priceMultiplier),
            sellerType: 'resident',
            sellerId: resident.id,
            itemType: 'material',
            quantity: 1,
            icon: '🎁',
            availableUntil: day + 3
          },
          {
            id: `${resident.id}_home_services`,
            name: 'Home Services',
            description: `${resident.name} offers cleaning and maintenance`,
            price: Math.floor(120 * priceMultiplier),
            sellerType: 'resident',
            sellerId: resident.id,
            itemType: 'service',
            quantity: 1,
            icon: '🏠',
            availableUntil: day + 2
          }
        ];
        
        const randomItem = residentItems[Math.floor(Math.random() * residentItems.length)];
        items.push(randomItem);
      }
    });
    
    if (Math.random() < 0.2) {
      const rareItems: MarketItem[] = [
        {
          id: 'golden_blueprint',
          name: 'Golden Blueprint',
          description: 'Unlocks a special building variant',
          price: 1000,
          sellerType: 'system',
          itemType: 'rare',
          quantity: 1,
          icon: '📜',
          availableUntil: day + 1
        },
        {
          id: 'time_crystal',
          name: 'Time Crystal',
          description: 'Skip to next day instantly',
          price: 500,
          sellerType: 'system',
          itemType: 'rare',
          quantity: 1,
          icon: '💎',
          availableUntil: day + 1
        }
      ];
      
      items.push(...rareItems);
    }
    
    setMarketItems(items);
  };
  
  const handleRefreshMarket = () => {
    if (coins >= refreshCost) {
      generateMarketItems();
      setLastRefresh(day);
      setRefreshCost(prev => Math.floor(prev * 1.2));
    }
  };
  
  const getItemRarityColor = (itemType: string) => {
    switch (itemType) {
      case 'rare': return 'border-purple-500 bg-purple-50';
      case 'building_upgrade': return 'border-blue-500 bg-blue-50';
      case 'service': return 'border-green-500 bg-green-50';
      case 'material': return 'border-orange-500 bg-orange-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };
  
  const renderBuyTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">Available Items</h3>
        <button
          onClick={handleRefreshMarket}
          disabled={coins < refreshCost}
          className={`flex items-center gap-2 px-3 py-1 rounded ${
            coins >= refreshCost
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <RefreshCw size={16} />
          Refresh ({refreshCost}c)
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {marketItems.map(item => {
          const seller = item.sellerId ? neighbors.find(n => n.id === item.sellerId) : null;
          const canAfford = coins >= item.price;
          
          return (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-lg border ${getItemRarityColor(item.itemType)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{item.price}c</div>
                  <div className="text-xs text-gray-500">x{item.quantity}</div>
                </div>
              </div>
              
              {seller && (
                <div className="text-xs text-gray-500 mb-2">
                  Sold by {seller.name} {seller.avatar}
                </div>
              )}
              
              {item.availableUntil && (
                <div className="text-xs text-orange-600 mb-2">
                  Available for {item.availableUntil - day} more day(s)
                </div>
              )}
              
              <button
                onClick={() => canAfford && onPurchase(item)}
                disabled={!canAfford}
                className={`w-full py-2 px-4 rounded ${
                  canAfford
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {canAfford ? 'Purchase' : 'Insufficient Funds'}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
  
  const renderSellTab = () => {
    const sellableItems = [
      { id: 'extra_materials', name: 'Extra Materials', icon: '📦', basePrice: 50 },
      { id: 'old_furniture', name: 'Old Furniture', icon: '🪑', basePrice: 80 },
      { id: 'vintage_decor', name: 'Vintage Decor', icon: '🏺', basePrice: 120 },
      { id: 'rare_artifact', name: 'Rare Artifact', icon: '💎', basePrice: 200 }
    ];
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Sell Your Items</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sellableItems.map(item => {
            const [customPrice, setCustomPrice] = useState(item.basePrice);
            
            return (
              <div key={item.id} className="p-4 border border-gray-300 rounded-lg bg-white">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{item.name}</h4>
                    <p className="text-sm text-gray-500">Base price: {item.basePrice}c</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-sm text-gray-600">Your price:</label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    min="0"
                  />
                  <span className="text-sm text-gray-600">coins</span>
                </div>
                
                <button
                  onClick={() => onSellItem(item.id, customPrice)}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  List for Sale
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const renderHistoryTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">Transaction History</h3>
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
        Transaction history feature coming soon!
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
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Store size={24} />
            <h2 className="text-lg font-medium lowercase">marketplace</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded">
              <Coins size={16} />
              <span>{coins} coins</span>
            </div>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex">
            {[
              { id: 'buy', icon: ShoppingCart, label: 'Buy' },
              { id: 'sell', icon: TrendingUp, label: 'Sell' },
              { id: 'history', icon: RefreshCw, label: 'History' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-3 transition-colors ${
                  activeTab === id
                    ? 'border-b-2 border-orange-500 text-orange-600 bg-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'buy' && renderBuyTab()}
              {activeTab === 'sell' && renderSellTab()}
              {activeTab === 'history' && renderHistoryTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}