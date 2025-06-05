import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ArrowRight, 
  Package, 
  Coins, 
  Heart, 
  Star, 
  Zap, 
  TrendingUp, 
  Gift, 
  Home,
  Building2,
  Users,
  Play,
  Target,
  Lightbulb,
  MapPin,
  Settings,
  Trophy,
  Factory,
  Sparkles,
  CheckCircle,
  ArrowDown,
  Coffee,
  Recycle,
  Wrench
} from "lucide-react";

type TutorialGuideProps = {
  step: number;
  onNextStep: () => void;
  onClose: () => void;
};

export default function TutorialGuide({ step, onNextStep, onClose }: TutorialGuideProps) {
  const totalSteps = 5;

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="w-24 h-24 bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-emerald-200"
              >
                <span className="text-4xl">🏙️</span>
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"
              >
                Welcome to NeighborVille!
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-lg leading-relaxed mb-6"
              >
                Build and manage your own thriving neighborhood! Create a perfect balance of residential, commercial, and production buildings while keeping your residents happy.
              </motion.p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 p-6 rounded-2xl border-2 border-emerald-200 shadow-lg"
            >
              <h4 className="text-xl font-bold mb-4 text-emerald-700 flex items-center gap-3">
                <Gift className="text-emerald-600" size={24} />
                Your Starting Resources
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/50"
                >
                  <div className="text-3xl mb-2">🪵</div>
                  <div className="font-bold text-gray-800 text-lg">Wood × 10</div>
                  <div className="text-sm text-gray-600">Essential for buildings</div>
                </motion.div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9, type: "spring" }}
                  className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/50"
                >
                  <div className="text-3xl mb-2">🪨</div>
                  <div className="font-bold text-gray-800 text-lg">Stone × 10</div>
                  <div className="text-sm text-gray-600">For construction</div>
                </motion.div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.0, type: "spring" }}
                  className="text-center bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-white/50"
                >
                  <div className="text-3xl mb-2">⛏️</div>
                  <div className="font-bold text-gray-800 text-lg">Iron Ore × 5</div>
                  <div className="text-sm text-gray-600">For advanced tools</div>
                </motion.div>
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="mt-4 p-3 bg-emerald-100 rounded-xl border border-emerald-200"
              >
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <Coins size={18} />
                  <span>Starting Budget: 2,000 coins</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-blue-50 p-4 rounded-xl border border-blue-200"
            >
              <div className="flex items-center gap-3 text-blue-700">
                <Lightbulb size={20} />
                <span className="font-semibold">Quick Tip:</span>
              </div>
              <p className="text-blue-600 mt-1">
                Your goal is to create a thriving community where residents are happy and your city generates steady income!
              </p>
            </motion.div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="w-24 h-24 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-blue-200"
              >
                <TrendingUp className="text-white" size={36} />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              >
                Master Your Economy
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-lg leading-relaxed mb-6"
              >
                Understanding these core systems will help you build a successful and sustainable neighborhood.
              </motion.p>
            </div>
            
            <div className="space-y-4">
              <motion.div 
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 p-5 rounded-2xl border-2 border-yellow-200 shadow-lg"
              >
                <h4 className="text-xl font-bold mb-3 text-amber-700 flex items-center gap-3">
                  <Coins className="text-amber-600" size={24} />
                  Coins System
                </h4>
                <p className="text-gray-700 mb-3 leading-relaxed">
                  Your primary currency for purchasing buildings and upgrades. Each building generates daily income, and you'll earn bonus coins from achievements and events.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/60 p-3 rounded-lg border border-amber-200">
                    <div className="font-semibold text-amber-800">Income Sources</div>
                    <div className="text-sm text-gray-600">Houses, shops, cafés</div>
                  </div>
                  <div className="bg-white/60 p-3 rounded-lg border border-amber-200">
                    <div className="font-semibold text-amber-800">Expenses</div>
                    <div className="text-sm text-gray-600">Buildings, services</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 p-5 rounded-2xl border-2 border-emerald-200 shadow-lg"
              >
                <h4 className="text-xl font-bold mb-3 text-emerald-700 flex items-center gap-3">
                  <Package className="text-emerald-600" size={24} />
                  Resource Management
                </h4>
                <p className="text-gray-700 mb-3 leading-relaxed">
                  Raw materials like wood, stone, and iron ore are essential for building production facilities and crafting advanced items that boost your economy.
                </p>
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-100 px-3 py-2 rounded-lg border border-emerald-200">
                  <Factory size={16} />
                  <span className="text-sm font-medium">Build sawmills and quarries to process resources</span>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 p-5 rounded-2xl border-2 border-pink-200 shadow-lg"
              >
                <h4 className="text-xl font-bold mb-3 text-pink-700 flex items-center gap-3">
                  <Heart className="text-pink-600" size={24} />
                  Community Happiness
                </h4>
                <p className="text-gray-700 mb-3 leading-relaxed">
                  Happy residents generate more income and unlock special bonuses. Maintain happiness through parks, entertainment, and essential services.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/60 p-2 rounded-lg border border-pink-200 text-center">
                    <span className="text-lg">🌳</span>
                    <div className="text-xs text-pink-700 font-medium">Parks</div>
                  </div>
                  <div className="bg-white/60 p-2 rounded-lg border border-pink-200 text-center">
                    <span className="text-lg">🎪</span>
                    <div className="text-xs text-pink-700 font-medium">Entertainment</div>
                  </div>
                  <div className="bg-white/60 p-2 rounded-lg border border-pink-200 text-center">
                    <span className="text-lg">🏥</span>
                    <div className="text-xs text-pink-700 font-medium">Services</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="w-24 h-24 bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-purple-200"
              >
                <Building2 className="text-white" size={36} />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              >
                Building Strategy
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-lg leading-relaxed mb-6"
              >
                Learn about different building types and how to create the perfect neighborhood layout for maximum efficiency.
              </motion.p>
            </div>
            
            <div className="space-y-4">
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-2xl border-2 border-blue-200 shadow-lg"
              >
                <h4 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-3">
                  <Home className="text-blue-600" size={24} />
                  Residential Buildings
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/70 p-4 rounded-xl border border-blue-200">
                    <div className="text-2xl mb-2">🏠</div>
                    <div className="font-bold text-blue-800">Houses</div>
                    <div className="text-sm text-gray-600">Basic income, low cost</div>
                  </div>
                  <div className="bg-white/70 p-4 rounded-xl border border-blue-200">
                    <div className="text-2xl mb-2">🏢</div>
                    <div className="font-bold text-blue-800">Apartments</div>
                    <div className="text-sm text-gray-600">Higher income, more residents</div>
                  </div>
                </div>
                <div className="text-sm text-blue-600 bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 flex items-center gap-2">
                  <Lightbulb size={16} />
                  <span>💡 Tip: Place residential buildings near parks and services for bonus happiness</span>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-5 rounded-2xl border-2 border-green-200 shadow-lg"
              >
                <h4 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-3">
                  <Coffee className="text-green-600" size={24} />
                  Commercial Buildings
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/70 p-4 rounded-xl border border-green-200">
                    <div className="text-2xl mb-2">☕</div>
                    <div className="font-bold text-green-800">Café</div>
                    <div className="text-sm text-gray-600">Steady income, attracts visitors</div>
                  </div>
                  <div className="bg-white/70 p-4 rounded-xl border border-green-200">
                    <div className="text-2xl mb-2">🏪</div>
                    <div className="font-bold text-green-800">Shop</div>
                    <div className="text-sm text-gray-600">Higher income, requires foot traffic</div>
                  </div>
                </div>
                <div className="text-sm text-green-600 bg-green-100 px-3 py-2 rounded-lg border border-green-200 flex items-center gap-2">
                  <Target size={16} />
                  <span>🎯 Strategy: Place shops near residential areas for maximum profit</span>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 p-5 rounded-2xl border-2 border-orange-200 shadow-lg"
              >
                <h4 className="text-xl font-bold text-orange-700 mb-4 flex items-center gap-3">
                  <Factory className="text-orange-600" size={24} />
                  Production Buildings
                </h4>
                <p className="text-gray-700 mb-3 leading-relaxed">
                  Transform raw materials into valuable goods. Production buildings require resources to operate but create items worth more than the input cost.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/70 p-3 rounded-lg border border-orange-200 text-center">
                    <div className="text-xl mb-1">🪚</div>
                    <div className="text-xs font-bold text-orange-800">Sawmill</div>
                    <div className="text-xs text-gray-600">Wood → Lumber</div>
                  </div>
                  <div className="bg-white/70 p-3 rounded-lg border border-orange-200 text-center">
                    <div className="text-xl mb-1">⛏️</div>
                    <div className="text-xs font-bold text-orange-800">Quarry</div>
                    <div className="text-xs text-gray-600">Stone → Bricks</div>
                  </div>
                  <div className="bg-white/70 p-3 rounded-lg border border-orange-200 text-center">
                    <div className="text-xl mb-1">🏭</div>
                    <div className="text-xs font-bold text-orange-800">Factory</div>
                    <div className="text-xs text-gray-600">Multi-purpose</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="w-24 h-24 bg-gradient-to-br from-red-400 via-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-red-200"
              >
                <Zap className="text-white" size={36} />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold mb-3 bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent"
              >
                Infrastructure & Services
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-lg leading-relaxed mb-6"
              >
                Essential services and infrastructure keep your city running smoothly and your residents happy.
              </motion.p>
            </div>
            
            <div className="space-y-4">
              <motion.div 
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 p-5 rounded-2xl border-2 border-yellow-200 shadow-lg"
              >
                <h4 className="text-xl font-bold text-amber-700 mb-3 flex items-center gap-3">
                  <Zap className="text-amber-600" size={24} />
                  Power & Water Systems
                </h4>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Larger buildings need electricity and water to function efficiently. Build power plants and water towers to supply your growing city.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/70 p-3 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">⚡</span>
                      <span className="font-bold text-amber-800">Power Plants</span>
                    </div>
                    <div className="text-sm text-gray-600">Supply electricity to buildings</div>
                  </div>
                  <div className="bg-white/70 p-3 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">💧</span>
                      <span className="font-bold text-amber-800">Water Towers</span>
                    </div>
                    <div className="text-sm text-gray-600">Provide clean water access</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 p-5 rounded-2xl border-2 border-green-200 shadow-lg"
              >
                <h4 className="text-xl font-bold text-green-700 mb-3 flex items-center gap-3">
                  <Recycle className="text-green-600" size={24} />
                  Environmental Services
                </h4>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Parks and recycling centers improve air quality and resident happiness while reducing the environmental impact of your city.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/70 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🌳</span>
                      <span className="font-bold text-green-800">Parks</span>
                    </div>
                    <div className="text-sm text-gray-600">Boost happiness significantly</div>
                  </div>
                  <div className="bg-white/70 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">♻️</span>
                      <span className="font-bold text-green-800">Recycling Centers</span>
                    </div>
                    <div className="text-sm text-gray-600">Reduce pollution, earn resources</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-2xl border-2 border-blue-200 shadow-lg"
              >
                <h4 className="text-xl font-bold text-blue-700 mb-3 flex items-center gap-3">
                  <Settings className="text-blue-600" size={24} />
                  Budget Management
                </h4>
                <p className="text-gray-700 mb-3 leading-relaxed">
                  Monitor your city's finances through the Budget & Finance modal. Adjust service spending and tax policies to optimize your economy.
                </p>
                <div className="text-sm text-blue-600 bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 flex items-center gap-2">
                  <Wrench size={16} />
                  <span>🔧 Access the budget panel from the game header to fine-tune your city</span>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="w-24 h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ring-4 ring-green-200 relative"
              >
                <span className="text-4xl">🚀</span>
                <motion.div
                  className="absolute inset-0 rounded-3xl border-2 border-green-400"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent"
              >
                Ready to Build Your Dream City!
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-lg leading-relaxed mb-6"
              >
                You're all set to create your perfect neighborhood! Here's your essential starting strategy to ensure early success.
              </motion.p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6 rounded-2xl border-2 border-emerald-200 shadow-lg"
            >
              <h4 className="text-xl font-bold mb-4 text-emerald-700 flex items-center gap-3">
                <Trophy className="text-emerald-600" size={24} />
                Your First 10 Minutes Strategy
              </h4>
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Build Income First",
                    description: "Place 2-3 houses and a café to generate steady coin income",
                    icon: "🏠",
                    delay: 0.7
                  },
                  {
                    step: 2,
                    title: "Process Starting Resources",
                    description: "Build a sawmill to convert wood into valuable lumber",
                    icon: "🪚",
                    delay: 0.8
                  },
                  {
                    step: 3,
                    title: "Add Happiness Boosters",
                    description: "Place a park near residential buildings for happiness bonus",
                    icon: "🌳",
                    delay: 0.9
                  },
                  {
                    step: 4,
                    title: "Monitor Your Budget",
                    description: "Check the Finance panel to track income and plan expansion",
                    icon: "💰",
                    delay: 1.0
                  }
                ].map((item) => (
                  <motion.div
                    key={item.step}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: item.delay }}
                    className="flex items-start gap-4 bg-white/70 p-4 rounded-xl border border-emerald-200"
                  >
                    <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-bold text-gray-800">{item.title}</span>
                      </div>
                      <div className="text-sm text-gray-600 leading-relaxed">{item.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 }}
                className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200"
              >
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Lightbulb size={20} />
                  <span className="font-bold">Pro Tips</span>
                </div>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Save your game regularly</li>
                  <li>• Experiment with layouts</li>
                  <li>• Watch the time - new day brings income!</li>
                </ul>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 }}
                className="bg-purple-50 p-4 rounded-xl border-2 border-purple-200"
              >
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                  <Star size={20} />
                  <span className="font-bold">Unlock Goals</span>
                </div>
                <ul className="text-sm text-purple-600 space-y-1">
                  <li>• Reach level 5 for premium buildings</li>
                  <li>• Complete achievements for XP</li>
                  <li>• Keep residents happy for bonuses</li>
                </ul>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.3 }}
              className="bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 p-4 rounded-xl border-2 border-green-200"
            >
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-green-700 mb-2">
                  <CheckCircle size={20} />
                  <span className="font-bold">You're Ready!</span>
                </div>
                <p className="text-green-600 text-sm">
                  Click the <strong>"Start Building!"</strong> button below to begin your NeighborVille journey. 
                  Remember, you can always access this tutorial again from the settings menu.
                </p>
              </div>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(16px)", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 30, rotateX: -10 }}
        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20, rotateX: 5 }}
        transition={{ 
          type: "spring", 
          damping: 20, 
          stiffness: 300,
          mass: 0.8
        }}
        className="bg-gradient-to-br from-white via-gray-50 to-white backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full shadow-2xl mx-4 relative border-2 border-white/30 overflow-hidden"
        style={{ maxHeight: '95vh', overflowY: 'auto' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-300 rounded-full opacity-40"
              initial={{ 
                x: Math.random() * 600, 
                y: Math.random() * 800,
                scale: 0
              }}
              animate={{ 
                y: [null, -20, -40],
                scale: [0, 1, 0],
                opacity: [0, 0.6, 0]
              }}
              transition={{ 
                duration: 3,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 2
              }}
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-all duration-200 shadow-lg z-10 backdrop-blur-sm border border-gray-200"
        >
          <X size={20} />
        </motion.button>
        
        <div className="mb-8">
          <div className="flex gap-2 mb-3">
            {[...Array(totalSteps)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: i < step ? 1 : 0 }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
                className={`h-3 flex-1 rounded-full relative overflow-hidden ${
                  i < step 
                    ? 'bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 shadow-lg' 
                    : 'bg-gray-200'
                }`}
              >
                {i < step && (
                  <motion.div
                    className="absolute inset-0 bg-white/30"
                    animate={{
                      x: ['-100%', '100%']
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
          
          <div className="text-center">
            <motion.span 
              key={step}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold shadow-lg border border-emerald-200"
            >
              <Sparkles size={16} />
              Step {step} of {totalSteps}
            </motion.span>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200"
        >
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Settings size={16} />
            </motion.div>
            <span>{step}/{totalSteps} completed</span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNextStep}
            className="flex items-center bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white py-3 px-8 rounded-2xl font-bold hover:from-emerald-600 hover:to-green-600 transition-all duration-300 shadow-xl hover:shadow-2xl border border-emerald-400"
          >
            {step < totalSteps ? (
              <>
                Continue
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="ml-2"
                >
                  <ArrowRight size={20} />
                </motion.div>
              </>
            ) : (
              <>
                <motion.span
                  animate={{
                    textShadow: ["0 0 0px rgba(255,255,255,0.5)", "0 0 10px rgba(255,255,255,0.8)", "0 0 0px rgba(255,255,255,0.5)"]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                >
                  Start Building!
                </motion.span>
                <motion.span 
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, 15, -15, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    delay: 0.5
                  }}
                  className="ml-2 text-xl"
                >
                  🚀
                </motion.span>
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}