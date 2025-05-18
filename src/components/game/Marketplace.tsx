import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Store, ShoppingCart, TrendingUp, RefreshCw, Coins, Star, CheckCircle, Package, DollarSign } from "lucide-react";
import type { Neighbor, Building, GameProgress } from "../../types/game";

export type MarketItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  sellerType: 'resident' | 'system' | 'traveling_merchant';
  sellerId?: string | number;
  itemType: 'material' | 'service' | 'rare' | 'building_upgrade' | 'boost' | 'decoration';
  quantity: number;
  icon: string;
  availableUntil?: number;
  effect?: string;
  duration?: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
};

type MarketplaceProps = {
  neighbors: Neighbor[];
  coins: number;
  day: number;
  onClose: () => void;
  onPurchase: (item: MarketItem) => void;
  onSellItem: (itemId: string, price: number) => void;
  onUpdateGameState: (updates: Partial<GameProgress>) => void;
  grid: (Building | null)[];
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
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'history' | 'inventory'>('buy');
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [refreshCost, setRefreshCost] = useState(50);
  const [lastRefresh, setLastRefresh] = useState(day);
  const [purchaseHistory, setPurchaseHistory] = useState<Array<{item: MarketItem, date: number, type: 'bought' | 'sold'}>>([]);
  const [inventory, setInventory] = useState<MarketItem[]>([]);
  const [travelingMerchant, setTravelingMerchant] = useState<{
    isPresent: boolean;
    leavesOnDay: number;
    items: MarketItem[];
  } | null>(null);
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    generateMarketItems();
    loadInventory();
    checkTravelingMerchant();
    
    const sellableItems = [
      { id: 'extra_materials', name: 'Extra Materials', icon: '📦', basePrice: 50 },
      { id: 'old_furniture', name: 'Old Furniture', icon: '🪑', basePrice: 80 },
      { id: 'vintage_decor', name: 'Vintage Decor', icon: '🏺', basePrice: 120 },
      { id: 'rare_artifact', name: 'Rare Artifact', icon: '💎', basePrice: 200 },
      { id: 'building_plans', name: 'Extra Building Plans', icon: '📋', basePrice: 300 },
      { id: 'neighborhood_photos', name: 'Neighborhood Photos', icon: '📸', basePrice: 150 }
    ];
    
    const initialPrices: Record<string, number> = {};
    sellableItems.forEach(item => {
      initialPrices[item.id] = item.basePrice;
    });
    setItemPrices(initialPrices);
  }, [day]);

  const loadInventory = () => {
    const savedInventory = localStorage.getItem(`neighborville_inventory_${gameProgress.playerName}`);
    if (savedInventory) {
      setInventory(JSON.parse(savedInventory));
    }
  };

  const saveInventory = (newInventory: MarketItem[]) => {
    setInventory(newInventory);
    localStorage.setItem(`neighborville_inventory_${gameProgress.playerName}`, JSON.stringify(newInventory));
  };

  const updateItemPrice = (itemId: string, price: number) => {
    setItemPrices(prev => ({
      ...prev,
      [itemId]: Math.max(0, price)
    }));
  };

  const checkTravelingMerchant = () => {
    if (!travelingMerchant && Math.random() < 0.15) {
      const leavesOnDay = day + 3;
      const merchantItems = generateTravelingMerchantItems();
      setTravelingMerchant({
        isPresent: true,
        leavesOnDay,
        items: merchantItems
      });
    } else if (travelingMerchant && day > travelingMerchant.leavesOnDay) {
      setTravelingMerchant(null);
    }
  };

  const generateTravelingMerchantItems = (): MarketItem[] => {
    const items: MarketItem[] = [
      {
        id: 'ancient_blueprint',
        name: 'Ancient Blueprint',
        description: 'Mysterious building plans from ages past',
        price: 1500,
        sellerType: 'traveling_merchant',
        itemType: 'rare',
        quantity: 1,
        icon: '📜',
        effect: 'Unlocks special building: Mystical Garden',
        rarity: 'legendary'
      },
      {
        id: 'time_crystal',
        name: 'Time Crystal',
        description: 'Skip to the next day instantly',
        price: 800,
        sellerType: 'traveling_merchant',
        itemType: 'service',
        quantity: 1,
        icon: '💎',
        effect: 'Jump forward one day',
        rarity: 'rare'
      },
      {
        id: 'golden_shovel',
        name: 'Golden Shovel',
        description: 'Building costs reduced for 14 days',
        price: 1200,
        sellerType: 'traveling_merchant',
        itemType: 'boost',
        quantity: 1,
        icon: '🪙',
        effect: '-20% building costs',
        duration: 14,
        rarity: 'rare'
      }
    ];

    return items.filter(() => Math.random() < 0.6);
  };

  const generateMarketItems = () => {
    const items: MarketItem[] = [];
    
    const systemItems: MarketItem[] = [
      {
        id: 'energy_booster',
        name: 'Energy Booster',
        description: 'Reduce energy consumption for 3 days',
        price: 200,
        sellerType: 'system',
        itemType: 'service',
        quantity: 1,
        icon: '⚡',
        effect: '-25% energy consumption',
        duration: 3,
        rarity: 'common'
      },
      {
        id: 'construction_materials',
        name: 'Construction Materials',
        description: 'Reduce building costs by 10% for 5 buildings',
        price: 300,
        sellerType: 'system',
        itemType: 'material',
        quantity: 3,
        icon: '🔨',
        effect: '-10% cost for next 5 buildings',
        rarity: 'common'
      },
      {
        id: 'xp_multiplier',
        name: 'Experience Booster',
        description: 'Double XP gains for 24 hours',
        price: 500,
        sellerType: 'system',
        itemType: 'boost',
        quantity: 1,
        icon: '📈',
        effect: '2x XP gains',
        duration: 1,
        rarity: 'uncommon'
      }
    ];
    
    items.push(...systemItems);
    
    const activeResidents = neighbors.filter(n => n.hasHome);
    activeResidents.forEach(resident => {
      if (Math.random() < 0.4) {
        const priceMultiplier = 0.7 + Math.random() * 0.6;
        const residentItems: MarketItem[] = [
          {
            id: `${resident.id}_handmade_craft`,
            name: 'Handmade Craft',
            description: `Unique decoration from ${resident.name}`,
            price: Math.floor(80 * priceMultiplier),
            sellerType: 'resident',
            sellerId: resident.id,
            itemType: 'decoration',
            quantity: 1,
            icon: '🎁',
            availableUntil: day + 3,
            effect: 'Beautiful decoration for your neighborhood',
            rarity: 'common'
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
            availableUntil: day + 2,
            effect: 'Repairs one building to 100% efficiency',
            rarity: 'common'
          },
          {
            id: `${resident.id}_tutoring`,
            name: 'Tutoring Services',
            description: `Learn from ${resident.name}'s expertise`,
            price: Math.floor(200 * priceMultiplier),
            sellerType: 'resident',
            sellerId: resident.id,
            itemType: 'service',
            quantity: 1,
            icon: '👨‍🏫',
            availableUntil: day + 1,
            effect: '+50% XP for the next 24 hours',
            duration: 1,
            rarity: 'uncommon'
          }
        ];
        
        const randomItem = residentItems[Math.floor(Math.random() * residentItems.length)];
        items.push(randomItem);
      }
    });
    
    if (Math.random() < 0.15) {
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
          availableUntil: day + 1,
          effect: 'Unlock premium building variant',
          rarity: 'rare'
        },
        {
          id: 'land_deed',
          name: 'Land Expansion Deed',
          description: 'Expand your plot at 50% discount',
          price: 750,
          sellerType: 'system',
          itemType: 'rare',
          quantity: 1,
          icon: '📄',
          availableUntil: day + 2,
          effect: 'Next plot expansion costs 50% less',
          rarity: 'rare'
        }
      ];
      
      items.push(...rareItems);
    }
    
    if (travelingMerchant?.isPresent) {
      items.push(...travelingMerchant.items);
    }
    
    setMarketItems(items);
  };
  
  const handleRefreshMarket = () => {
    if (coins >= refreshCost) {
      onUpdateGameState({ coins: coins - refreshCost });
      generateMarketItems();
      setLastRefresh(day);
      setRefreshCost(prev => Math.floor(prev * 1.2));
    }
  };
  
  const getItemRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500 bg-yellow-50 shadow-yellow-500/20';
      case 'rare': return 'border-purple-500 bg-purple-50 shadow-purple-500/20';
      case 'uncommon': return 'border-blue-500 bg-blue-50 shadow-blue-500/20';
      case 'common':
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const handlePurchaseItem = (item: MarketItem) => {
    if (coins >= item.price) {
      onPurchase(item);
      
      const newInventory = [...inventory];
      const existingItem = newInventory.find(i => i.id === item.id);
      
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        newInventory.push({ ...item, quantity: item.quantity });
      }
      
      saveInventory(newInventory);
      
      const history = [...purchaseHistory, { item, date: Date.now(), type: 'bought' as const }];
      setPurchaseHistory(history);
      
      applyItemEffect(item);
    }
  };

  const applyItemEffect = (item: MarketItem) => {
    const updates: Partial<GameProgress> = {};
    
    switch (item.id) {
      case 'time_crystal':
        updates.day = gameProgress.day + 1;
        updates.gameTime = 8;
        break;
        
      case 'xp_multiplier':
        updates.experience = gameProgress.experience + 100;
        break;
        
      case 'energy_booster':
        updates.totalEnergyUsage = Math.max(0, gameProgress.totalEnergyUsage * 0.75);
        break;
    }
    
    if (Object.keys(updates).length > 0) {
      onUpdateGameState(updates);
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

      {travelingMerchant?.isPresent && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎪</span>
            <h4 className="font-medium text-purple-800">Traveling Merchant</h4>
            <span className="ml-auto text-sm text-purple-600">
              Leaves in {travelingMerchant.leavesOnDay - day} day{travelingMerchant.leavesOnDay - day !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {travelingMerchant.items.map(item => renderItemCard(item))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {marketItems.filter(item => item.sellerType !== 'traveling_merchant').map(renderItemCard)}
      </div>
    </div>
  );

  const renderItemCard = (item: MarketItem) => {
    const seller = item.sellerId ? neighbors.find(n => n.id === item.sellerId) : null;
    const canAfford = coins >= item.price;
    const isExpired = item.availableUntil && day > item.availableUntil;
    
    return (
      <motion.div
        key={item.id}
        whileHover={{ scale: 1.02 }}
        className={`p-4 rounded-lg border shadow-md ${getItemRarityColor(item.rarity)} ${
          isExpired ? 'opacity-60' : ''
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-800">{item.name}</h4>
                {item.rarity && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    item.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                    item.rarity === 'rare' ? 'bg-purple-200 text-purple-800' :
                    item.rarity === 'uncommon' ? 'bg-blue-200 text-blue-800' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {item.rarity}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900 flex items-center gap-1">
              <Coins size={16} className="text-yellow-600" />
              {item.price}
            </div>
            <div className="text-xs text-gray-500">x{item.quantity}</div>
          </div>
        </div>
        
        {item.effect && (
          <div className="text-sm text-emerald-600 mb-2">
            Effect: {item.effect}
            {item.duration && <span className="text-gray-500"> (for {item.duration} day{item.duration !== 1 ? 's' : ''})</span>}
          </div>
        )}
        
        {seller && (
          <div className="text-xs text-gray-500 mb-2">
            Sold by {seller.name} {seller.avatar}
          </div>
        )}
        
        {item.availableUntil && (
          <div className={`text-xs mb-2 ${
            isExpired ? 'text-red-600' : 'text-orange-600'
          }`}>
            {isExpired ? 'Expired' : `Available for ${item.availableUntil - day} more day(s)`}
          </div>
        )}
        
        <button
          onClick={() => canAfford && !isExpired && handlePurchaseItem(item)}
          disabled={!canAfford || isExpired}
          className={`w-full py-2 px-4 rounded text-sm flex items-center justify-center gap-2 ${
            canAfford && !isExpired
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isExpired ? (
            <>Expired</>
          ) : canAfford ? (
            <>
              <ShoppingCart size={14} />
              Purchase
            </>
          ) : (
            'Insufficient Funds'
          )}
        </button>
      </motion.div>
    );
  };
  
  const renderSellTab = () => {
    const inventoryItems = inventory.filter(item => item.quantity > 0);
    
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Sell Items from Inventory</h3>
          {inventoryItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {inventoryItems.map(item => (
                <div key={item.id} className="p-3 border border-gray-300 rounded-lg bg-white">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{item.name}</h4>
                      <p className="text-xs text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{Math.floor(item.price * 0.7)} coins</div>
                    </div>
                  </div>
                  <button
                    onClick={() => sellInventoryItem(item)}
                    className="w-full py-1 px-3 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    Sell
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
              Your inventory is empty
            </div>
          )}
        </div>
      </div>
    );
  };

  const sellInventoryItem = (item: MarketItem) => {
    const sellPrice = Math.floor(item.price * 0.7);
    const newInventory = inventory.map(invItem => 
      invItem.id === item.id 
        ? { ...invItem, quantity: invItem.quantity - 1 }
        : invItem
    ).filter(invItem => invItem.quantity > 0);
    
    saveInventory(newInventory);
    onUpdateGameState({ coins: coins + sellPrice });
    
    const history = [...purchaseHistory, { 
      item: { ...item, price: sellPrice }, 
      date: Date.now(), 
      type: 'sold' as const 
    }];
    setPurchaseHistory(history);
  };

  const handleSellCustomItem = (itemId: string, price: number) => {
    onSellItem(itemId, price);
    const sellPrice = Math.floor(price * 0.9);
    onUpdateGameState({ coins: coins + sellPrice });
  };
  
  const renderHistoryTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">Transaction History</h3>
      {purchaseHistory.length > 0 ? (
        <div className="space-y-2">
          {purchaseHistory.slice().reverse().map((transaction, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-xl">{transaction.item.icon}</span>
                <div>
                  <div className="font-medium text-gray-700">{transaction.item.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className={`text-right ${
                transaction.type === 'bought' ? 'text-red-600' : 'text-green-600'
              }`}>
                <div className="font-medium">
                  {transaction.type === 'bought' ? '-' : '+'}{transaction.item.price} coins
                </div>
                <div className="text-xs text-gray-500">{transaction.type}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
          No transaction history yet
        </div>
      )}
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
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
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
              { id: 'sell', icon: DollarSign, label: 'Sell' },
              { id: 'inventory', icon: Package, label: 'Inventory' },
              { id: 'history', icon: TrendingUp, label: 'History' }
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
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
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
              {activeTab === 'inventory' && renderInventoryTab()}
              {activeTab === 'history' && renderHistoryTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );

  function renderInventoryTab() {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Your Inventory</h3>
        {inventory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inventory.map(item => (
              <div key={item.id} className={`p-4 rounded-lg border ${getItemRarityColor(item.rarity)}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-800">{item.name}</h4>
                      {item.rarity && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                          item.rarity === 'rare' ? 'bg-purple-200 text-purple-800' :
                          item.rarity === 'uncommon' ? 'bg-blue-200 text-blue-800' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {item.rarity}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">x{item.quantity}</p>
                  </div>
                </div>
                {item.effect && (
                  <p className="text-sm text-emerald-600 mb-2">{item.effect}</p>
                )}
                <button
                  onClick={() => useInventoryItem(item)}
                  disabled={item.itemType !== 'service' && item.itemType !== 'boost'}
                  className={`w-full py-1 px-3 rounded text-sm ${
                    item.itemType === 'service' || item.itemType === 'boost'
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {item.itemType === 'service' || item.itemType === 'boost' ? 'Use' : 'Decorative'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-gray-50 rounded-lg text-center text-gray-500">
            <Package size={48} className="mx-auto mb-2 text-gray-300" />
            Your inventory is empty
          </div>
        )}
      </div>
    );
  }

  function useInventoryItem(item: MarketItem) {
    if (item.itemType === 'service' || item.itemType === 'boost') {
      applyItemEffect(item);
      
      const newInventory = inventory.map(invItem => 
        invItem.id === item.id 
          ? { ...invItem, quantity: invItem.quantity - 1 }
          : invItem
      ).filter(invItem => invItem.quantity > 0);
      
      saveInventory(newInventory);
    }
  }
}