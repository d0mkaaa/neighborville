import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, Home, Building2, DollarSign, Zap, Users, 
  Settings, Trophy, Lightbulb, BookOpen, HelpCircle,
  ChevronRight, Star, Wrench, TreePine, Heart
} from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';

type GameWikiProps = {
  isOpen: boolean;
  onClose: () => void;
};

interface WikiSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  category: 'basics' | 'buildings' | 'economy' | 'advanced' | 'tips';
}

const wikiSections: WikiSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Home size={20} />,
    category: 'basics',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Welcome to NeighborVille! 🏘️</h3>
        <p className="text-gray-700 leading-relaxed">
          NeighborVille is a city-building game where you create and manage your own neighborhood. 
          Start by placing buildings, managing resources, and keeping your residents happy!
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">First Steps:</h4>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Click on empty tiles to place buildings</li>
            <li>• Collect income from your buildings daily</li>
            <li>• Keep an eye on your residents' happiness</li>
            <li>• Expand your city as you progress</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'buildings-overview',
    title: 'Buildings Overview',
    icon: <Building2 size={20} />,
    category: 'buildings',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Building Types 🏗️</h3>
        
        <div className="grid gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Home size={16} className="text-blue-600" />
              <h4 className="font-semibold text-gray-800">Residential</h4>
            </div>
            <p className="text-gray-600 text-sm">Houses and apartments where your neighbors live. Higher-tier buildings house more residents and generate more income.</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={16} className="text-green-600" />
              <h4 className="font-semibold text-gray-800">Commercial</h4>
            </div>
            <p className="text-gray-600 text-sm">Shops, restaurants, and businesses that provide income and keep residents happy with shopping and entertainment.</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-yellow-600" />
              <h4 className="font-semibold text-gray-800">Utilities</h4>
            </div>
            <p className="text-gray-600 text-sm">Power plants and water facilities that provide essential services to your city. Connect them with utility lines.</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TreePine size={16} className="text-emerald-600" />
              <h4 className="font-semibold text-gray-800">Parks & Recreation</h4>
            </div>
            <p className="text-gray-600 text-sm">Parks, playgrounds, and recreational facilities that boost happiness and provide environmental benefits.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'economy-basics',
    title: 'Economy & Coins',
    icon: <DollarSign size={20} />,
    category: 'economy',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Managing Your Economy 💰</h3>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">Income Sources:</h4>
          <ul className="text-green-700 space-y-1 text-sm">
            <li>• Residential buildings generate daily rent</li>
            <li>• Commercial buildings provide business income</li>
            <li>• Special buildings offer unique bonuses</li>
            <li>• Achievements reward coins and XP</li>
          </ul>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">Expenses to Consider:</h4>
          <ul className="text-red-700 space-y-1 text-sm">
            <li>• Building construction costs</li>
            <li>• Monthly utility bills</li>
            <li>• Building upgrades and maintenance</li>
            <li>• City expansion fees</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Pro Tips:</h4>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Balance income-generating and happiness-boosting buildings</li>
            <li>• Upgrade buildings to increase their efficiency</li>
            <li>• Pay bills on time to avoid penalties</li>
            <li>• Save coins for major expansions</li>
          </ul>
        </div>
      </div>
    )
  },

  {
    id: 'utilities-guide',
    title: 'Utilities & Infrastructure',
    icon: <Zap size={20} />,
    category: 'advanced',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Power & Water Systems ⚡💧</h3>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">How Utilities Work:</h4>
          <ul className="text-yellow-700 space-y-1 text-sm">
            <li>• Power plants generate electricity for your city</li>
            <li>• Water facilities provide clean water to buildings</li>
            <li>• Buildings must be connected to function properly</li>
            <li>• Utility usage affects your monthly bills</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Connection Tips:</h4>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Use the utility connection tool to link buildings</li>
            <li>• Closer connections are more efficient</li>
            <li>• Plan your layout to minimize connection costs</li>
            <li>• Upgrade utilities as your city grows</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'achievements',
    title: 'Achievements & Progression',
    icon: <Trophy size={20} />,
    category: 'advanced',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Unlock Your Potential 🏆</h3>
        
        <p className="text-gray-700 leading-relaxed">
          Achievements provide goals to work towards and reward you with coins, XP, and special unlocks.
        </p>
        
        <div className="grid gap-3">
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Star size={14} className="text-yellow-500" />
              <span className="font-medium text-sm">Building Achievements</span>
            </div>
            <p className="text-xs text-gray-600">Construct specific numbers or types of buildings</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-blue-500" />
              <span className="font-medium text-sm">Population Milestones</span>
            </div>
            <p className="text-xs text-gray-600">Reach certain resident counts in your city</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-green-500" />
              <span className="font-medium text-sm">Economic Goals</span>
            </div>
            <p className="text-xs text-gray-600">Accumulate wealth and manage finances effectively</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'advanced-strategies',
    title: 'Advanced Strategies',
    icon: <Lightbulb size={20} />,
    category: 'tips',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Pro Mayor Tips 💡</h3>
        
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-2">City Layout Strategy:</h4>
            <ul className="text-purple-700 space-y-1 text-sm">
              <li>• Group similar buildings together for efficiency bonuses</li>
              <li>• Place parks near residential areas for satisfaction</li>
              <li>• Keep utilities centrally located to minimize connection costs</li>
              <li>• Plan for future expansion when placing buildings</li>
            </ul>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-800 mb-2">Economic Optimization:</h4>
            <ul className="text-indigo-700 space-y-1 text-sm">
              <li>• Reinvest profits into building upgrades</li>
              <li>• Balance short-term income with long-term growth</li>
              <li>• Monitor your daily income vs. expenses ratio</li>
              <li>• Use special events to boost your economy</li>
            </ul>
          </div>
          
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h4 className="font-semibold text-teal-800 mb-2">Time Management:</h4>
            <ul className="text-teal-700 space-y-1 text-sm">
              <li>• Use time acceleration wisely during building phases</li>
              <li>• Plan major constructions during quiet periods</li>
              <li>• Take advantage of time-based bonuses</li>
              <li>• Regular save your progress to avoid losing work</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'troubleshooting',
    title: 'Common Issues & Solutions',
    icon: <Wrench size={20} />,
    category: 'tips',
    content: (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Troubleshooting Guide 🔧</h3>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">🔋 Power Issues</h4>
            <p className="text-sm text-gray-600 mb-2"><strong>Problem:</strong> Buildings showing "No Power" status</p>
            <p className="text-sm text-gray-700"><strong>Solution:</strong> Build more power plants or connect existing buildings to the power grid using utility connections.</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">💧 Water Shortages</h4>
            <p className="text-sm text-gray-600 mb-2"><strong>Problem:</strong> Residents complaining about water supply</p>
            <p className="text-sm text-gray-700"><strong>Solution:</strong> Construct water treatment plants and ensure all residential areas are connected to the water grid.</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">😟 Low Satisfaction</h4>
            <p className="text-sm text-gray-600 mb-2"><strong>Problem:</strong> Residents are dissatisfied and paying less rent</p>
            <p className="text-sm text-gray-700"><strong>Solution:</strong> Add parks, ensure reliable utilities, build entertainment venues, and address any city-wide issues promptly.</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">💸 Financial Problems</h4>
            <p className="text-sm text-gray-600 mb-2"><strong>Problem:</strong> Running out of coins frequently</p>
            <p className="text-sm text-gray-700"><strong>Solution:</strong> Focus on income-generating buildings first, pay bills on time, and avoid overspending on decorative items early in the game.</p>
          </div>
        </div>
      </div>
    )
  }
];

export default function GameWiki({ isOpen, onClose }: GameWikiProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Topics', icon: <BookOpen size={16} /> },
    { id: 'basics', name: 'Basics', icon: <Home size={16} /> },
    { id: 'buildings', name: 'Buildings', icon: <Building2 size={16} /> },
    { id: 'economy', name: 'Economy', icon: <DollarSign size={16} /> },
    { id: 'advanced', name: 'Advanced', icon: <Settings size={16} /> },
    { id: 'tips', name: 'Tips & Tricks', icon: <Lightbulb size={16} /> }
  ];

  const filteredSections = useMemo(() => {
    return wikiSections.filter(section => {
      const matchesSearch = searchTerm === '' || 
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleSectionClick = (sectionId: string) => {
    setSelectedSection(selectedSection === sectionId ? null : sectionId);
  };

  return (
    <ModalWrapper 
      isOpen={isOpen} 
      onClose={onClose} 
      title="📚 Game Wiki" 
      headerColor="glass"
      maxWidth="2xl"
    >
      <div className="flex h-[600px]">
        <div className="w-80 border-r border-gray-200 bg-gray-50">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search wiki..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category.icon}
                  <span className="text-sm">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors mb-1 ${
                    selectedSection === section.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {section.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{section.title}</div>
                  </div>
                  <ChevronRight 
                    size={16} 
                    className={`transform transition-transform ${
                      selectedSection === section.id ? 'rotate-90' : ''
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <AnimatePresence mode="wait">
              {selectedSection ? (
                <motion.div
                  key={selectedSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {wikiSections.find(s => s.id === selectedSection)?.content}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Welcome to the NeighborVille Wiki!</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Select a topic from the sidebar to learn more about the game mechanics, strategies, and tips for building the perfect neighborhood.
                  </p>
                  
                  <div className="mt-8 grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <button
                      onClick={() => handleSectionClick('getting-started')}
                      className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Home size={24} className="mx-auto text-blue-600 mb-2" />
                      <div className="text-sm font-medium text-blue-700">Getting Started</div>
                    </button>
                    <button
                      onClick={() => handleSectionClick('buildings-overview')}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <Building2 size={24} className="mx-auto text-green-600 mb-2" />
                      <div className="text-sm font-medium text-green-700">Buildings Guide</div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
} 