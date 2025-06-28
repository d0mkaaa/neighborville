import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Home, 
  Users, 
  Coins, 
  Zap, 
  Calendar, 
  Settings, 
  Trophy,
  Building2,
  Heart,
  TrendingUp,
  Clock,
  Sun,
  Moon,
  Cloud,
  Droplets,
  MapPin,
  Target,
  Lightbulb,
  CheckCircle,
  PlayCircle,
  Book,
  Star,
  Hammer,
  ShoppingCart,
  BarChart3,
  Gift,
  Crown,
  Wrench
} from 'lucide-react';

type TutorialStep = {
  id: number;
  title: string;
  content: React.ReactNode;
  category: 'basics' | 'building' | 'management' | 'advanced' | 'tips';
  icon: React.ReactNode;
  interactive?: boolean;
  highlight?: string;
  tasks?: string[];
  tips?: string[];
};

type TutorialGuideProps = {
  step: number;
  onNextStep: () => void;
  onClose: () => void;
  onComplete?: () => void;
};

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to NeighborVille!",
    category: 'basics',
    icon: <Crown className="text-yellow-500" size={24} />,
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-white" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome, Mayor!</h3>
          <p className="text-gray-600">
            You've just been elected as the mayor of a brand new neighborhood. Your job is to build a thriving community that keeps your residents happy and prosperous.
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🎯 Your Goals:</h4>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Build houses and attract neighbors</li>
            <li>• Manage your city's budget and resources</li>
            <li>• Keep residents happy with amenities</li>
            <li>• Expand your neighborhood as you level up</li>
            <li>• Unlock achievements and special buildings</li>
          </ul>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            This tutorial will teach you everything you need to know to become a successful mayor!
          </p>
        </div>
      </div>
    )
  },

  {
    id: 2,
    title: "Understanding the Interface",
    category: 'basics',
    icon: <Settings className="text-gray-500" size={24} />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Game Interface Overview</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="text-green-600" size={16} />
              <span className="font-semibold text-green-800">Coins</span>
            </div>
            <p className="text-green-700 text-sm">Your main currency for building and upgrades</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-blue-600" size={16} />
              <span className="font-semibold text-blue-800">Energy</span>
            </div>
            <p className="text-blue-700 text-sm">Powers your buildings - manage it wisely</p>
          </div>
          

          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-orange-600" size={16} />
              <span className="font-semibold text-orange-800">Day/Time</span>
            </div>
            <p className="text-orange-700 text-sm">Time affects income and events</p>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">💡 Quick Tip:</h4>
          <p className="text-gray-700 text-sm">
            Keep an eye on all these metrics - they work together to determine your city's success!
          </p>
        </div>
      </div>
    )
  },

  {
    id: 3,
    title: "Building Your First House",
    category: 'building',
    icon: <Home className="text-blue-500" size={24} />,
    interactive: true,
    tasks: [
      "Click on an empty tile in the grid",
      "Select 'Small House' from the building menu",
      "Complete the mini-game to build it"
    ],
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Let's Build Your First House!</h3>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🏠 Building Process:</h4>
          <ol className="text-blue-700 space-y-2 text-sm">
            <li><strong>1.</strong> Click on any empty gray tile in the grid</li>
            <li><strong>2.</strong> Choose "Small House" from the building options</li>
            <li><strong>3.</strong> Complete the mini-game to construct it</li>
            <li><strong>4.</strong> Watch your first house appear!</li>
          </ol>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h5 className="font-semibold text-green-800 mb-1">Small House</h5>
            <p className="text-green-700 text-xs">Cost: 50 coins</p>
            <p className="text-green-700 text-xs">Income: +5 coins/day</p>
            <p className="text-green-700 text-xs">Capacity: 1 neighbor</p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h5 className="font-semibold text-yellow-800 mb-1">Mini-Games</h5>
            <p className="text-yellow-700 text-xs">Fun puzzles that make building interactive!</p>
            <p className="text-yellow-700 text-xs">Different games for different buildings</p>
          </div>
        </div>
        
        <div className="text-center bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <PlayCircle className="text-indigo-600 mx-auto mb-2" size={20} />
          <p className="text-indigo-800 text-sm font-medium">Try building your first house now!</p>
        </div>
      </div>
    )
  },

  {
    id: 4,
    title: "Attracting Your First Neighbor",
    category: 'building',
    icon: <Users className="text-green-500" size={24} />,
    tasks: [
      "Open the neighbor panel on the right",
      "Click on an available neighbor",
      "Assign them to your house"
    ],
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Welcome Your First Resident!</h3>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">👥 How Neighbors Work:</h4>
          <ul className="text-green-700 space-y-1 text-sm">
            <li>• Each neighbor has unique traits and preferences</li>
            <li>• Happy neighbors pay more rent</li>
            <li>• Some neighbors unlock special buildings</li>
            <li>• Different houses attract different neighbor types</li>
          </ul>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="text-purple-600" size={16} />
              <span className="font-semibold text-purple-800">Satisfaction</span>
            </div>
            <p className="text-purple-700 text-sm">Keep neighbors happy for better income</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-blue-600" size={16} />
              <span className="font-semibold text-blue-800">Rent Income</span>
            </div>
            <p className="text-blue-700 text-sm">Happy neighbors = more daily income</p>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 Pro Tip:</h4>
          <p className="text-yellow-700 text-sm">
            Check neighbor preferences! Some love parks, others prefer shops nearby. Match their needs for better income.
          </p>
        </div>
      </div>
    )
  },

  {
    id: 5,
    title: "Understanding Time & Weather",
    category: 'basics',
    icon: <Clock className="text-orange-500" size={24} />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Time Affects Everything!</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="text-yellow-600" size={16} />
              <span className="font-semibold text-yellow-800">Day Time</span>
            </div>
            <p className="text-yellow-700 text-sm">Shops earn more, construction is faster</p>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="text-indigo-600" size={16} />
              <span className="font-semibold text-indigo-800">Night Time</span>
            </div>
            <p className="text-indigo-700 text-sm">Residential income increases, less activity</p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="text-gray-600" size={16} />
              <span className="font-semibold text-gray-800">Cloudy</span>
            </div>
            <p className="text-gray-700 text-sm">Slower construction, normal income</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="text-blue-600" size={16} />
              <span className="font-semibold text-blue-800">Rainy</span>
            </div>
            <p className="text-blue-700 text-sm">Plants grow better in rainy weather</p>
          </div>
        </div>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h4 className="font-semibold text-indigo-800 mb-2">⏰ Time Controls:</h4>
          <ul className="text-indigo-700 space-y-1 text-sm">
            <li>• Click the pause button to stop time</li>
            <li>• Use 1x, 2x, 3x speed controls</li>
            <li>• "End Day" button skips to next day</li>
            <li>• Watch for special timed events!</li>
          </ul>
        </div>
      </div>
    )
  },

  {
    id: 6,
    title: "Managing Energy & Utilities",
    category: 'management',
    icon: <Zap className="text-yellow-500" size={24} />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Power Up Your City!</h3>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">⚡ Energy Basics:</h4>
          <ul className="text-red-700 space-y-1 text-sm">
            <li>• All buildings consume energy</li>
            <li>• No power = buildings don't work properly</li>
            <li>• Build power plants to generate electricity</li>
            <li>• Connect buildings with power lines</li>
          </ul>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h5 className="font-semibold text-yellow-800 mb-1">Power Plant</h5>
            <p className="text-yellow-700 text-xs">Generates electricity for your city</p>
            <p className="text-yellow-700 text-xs">Higher level = more power</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="font-semibold text-blue-800 mb-1">Water Tower</h5>
            <p className="text-blue-700 text-xs">Provides water to buildings</p>
            <p className="text-blue-700 text-xs">Essential for city operations</p>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">💡 Energy Tips:</h4>
          <ul className="text-green-700 space-y-1 text-sm">
            <li>• Check the energy panel regularly</li>
            <li>• Upgrade power plants when needed</li>
            <li>• Some buildings are more energy-efficient</li>
            <li>• Solar panels work better during the day</li>
          </ul>
        </div>
      </div>
    )
  },

  {
    id: 7,
    title: "Managing Your Budget",
    category: 'management',
    icon: <BarChart3 className="text-green-500" size={24} />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Master Your Finances!</h3>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">💰 Income Sources:</h4>
          <ul className="text-green-700 space-y-1 text-sm">
            <li>• <strong>Rent:</strong> Daily income from residents</li>
            <li>• <strong>Shops:</strong> Earn from commercial buildings</li>
            <li>• <strong>Taxes:</strong> Set tax policies for extra income</li>
            <li>• <strong>Events:</strong> Special opportunities for bonus coins</li>
          </ul>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-semibold text-red-800 mb-2">💸 Expenses:</h4>
          <ul className="text-red-700 space-y-1 text-sm">
            <li>• <strong>Energy Bills:</strong> Monthly utility costs</li>
            <li>• <strong>Maintenance:</strong> Keeping buildings in good shape</li>
            <li>• <strong>Construction:</strong> Building and upgrading costs</li>
            <li>• <strong>Services:</strong> Police, fire, healthcare budgets</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">📊 Budget Tips:</h4>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>• Open the Budget Modal to see detailed finances</li>
            <li>• Balance income and expenses carefully</li>
            <li>• Invest in upgrades for long-term profits</li>
            <li>• Don't overspend - keep an emergency fund!</li>
          </ul>
        </div>
      </div>
    )
  },

  {
    id: 8,
    title: "Types of Buildings",
    category: 'building',
    icon: <Building2 className="text-purple-500" size={24} />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Building Categories</h3>
        
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Home className="text-blue-600" size={16} />
              <span className="font-semibold text-blue-800">Residential</span>
            </div>
            <p className="text-blue-700 text-sm mb-2">Houses, apartments, condos for your neighbors</p>
            <p className="text-blue-600 text-xs">Income: Rent • Quality affects rent amount</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="text-green-600" size={16} />
              <span className="font-semibold text-green-800">Commercial</span>
            </div>
            <p className="text-green-700 text-sm mb-2">Shops, restaurants, entertainment venues</p>
            <p className="text-green-600 text-xs">Income: High during day • Convenient for residents</p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Hammer className="text-yellow-600" size={16} />
              <span className="font-semibold text-yellow-800">Industrial</span>
            </div>
            <p className="text-yellow-700 text-sm mb-2">Factories, production facilities</p>
            <p className="text-yellow-600 text-xs">Income: Steady • Place away from residential areas</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="text-purple-600" size={16} />
              <span className="font-semibold text-purple-800">Community</span>
            </div>
            <p className="text-purple-700 text-sm mb-2">Parks, schools, hospitals, police stations</p>
            <p className="text-purple-600 text-xs">Income: Low/None • Improves city appeal</p>
          </div>
        </div>
        
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h4 className="font-semibold text-indigo-800 mb-2">🏗️ Building Strategy:</h4>
          <p className="text-indigo-700 text-sm">
            Mix different building types! Residents need homes, but they also want shops, parks, and services nearby for better income and appeal.
          </p>
        </div>
      </div>
    )
  },

  {
    id: 9,
    title: "Achievements & Progression",
    category: 'advanced',
    icon: <Trophy className="text-yellow-500" size={24} />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Level Up Your Mayorship!</h3>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">🏆 Achievement System:</h4>
          <ul className="text-yellow-700 space-y-1 text-sm">
            <li>• Complete specific goals to earn XP</li>
            <li>• Unlock new buildings and features</li>
            <li>• Show off your mayoral skills</li>
            <li>• Some achievements give permanent bonuses</li>
          </ul>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Star className="text-green-600" size={16} />
              <span className="font-semibold text-green-800">Experience</span>
            </div>
            <p className="text-green-700 text-sm">Gain XP from building, events, and achievements</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="text-blue-600" size={16} />
              <span className="font-semibold text-blue-800">Mayor Level</span>
            </div>
            <p className="text-blue-700 text-sm">Higher levels unlock advanced buildings</p>
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-2">🎯 Example Achievements:</h4>
          <ul className="text-purple-700 space-y-1 text-sm">
            <li>• "First Home" - Build your first house</li>
            <li>• "Thriving Community" - Reach 20 residents</li>
            <li>• "Big Spender" - Spend 1000 coins in one day</li>
            <li>• "Green Mayor" - Build 5 parks</li>
            <li>• "Millionaire" - Accumulate 10,000 coins</li>
          </ul>
        </div>
      </div>
    )
  },

  {
    id: 10,
    title: "Pro Tips & Strategies",
    category: 'tips',
    icon: <Lightbulb className="text-orange-500" size={24} />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800">Master Mayor Strategies!</h3>
        
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-semibold text-green-800 mb-2">💡 Planning Tips:</h4>
            <ul className="text-green-700 space-y-1 text-sm">
              <li>• Plan your layout before building</li>
              <li>• Group similar buildings together</li>
              <li>• Leave space for future expansion</li>
              <li>• Consider neighbor preferences when placing buildings</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-blue-800 mb-2">💰 Economic Strategies:</h4>
            <ul className="text-blue-700 space-y-1 text-sm">
              <li>• Start with small houses, upgrade later</li>
              <li>• Balance income buildings with community buildings</li>
              <li>• Upgrade buildings for better efficiency</li>
              <li>• Watch your energy consumption vs. production</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <h4 className="font-semibold text-purple-800 mb-2">🏘️ Community Tips:</h4>
            <ul className="text-purple-700 space-y-1 text-sm">
              <li>• Parks improve overall city appeal</li>
              <li>• Keep industrial buildings away from homes</li>
              <li>• Provide utilities to all buildings</li>
              <li>• Match neighbors to their preferred housing</li>
            </ul>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <h4 className="font-semibold text-orange-800 mb-2">⚡ Advanced Tips:</h4>
            <ul className="text-orange-700 space-y-1 text-sm">
              <li>• Use time controls strategically</li>
              <li>• Save before making big decisions</li>
              <li>• Participate in seasonal events</li>
              <li>• Check the marketplace for special items</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },

  {
    id: 11,
    title: "You're Ready to Lead!",
    category: 'basics',
    icon: <CheckCircle className="text-green-500" size={24} />,
    content: (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="text-white" size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Congratulations, Mayor!</h3>
          <p className="text-gray-600">
            You've completed the NeighborVille tutorial and learned the fundamentals of city management.
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">🎓 What You've Learned:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle size={14} className="text-green-500" />
              <span>Game interface</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle size={14} className="text-green-500" />
              <span>Building construction</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle size={14} className="text-green-500" />
              <span>Neighbor management</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle size={14} className="text-green-500" />
              <span>Resource management</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle size={14} className="text-green-500" />
              <span>Time and weather</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle size={14} className="text-green-500" />
              <span>Advanced strategies</span>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">🚀 Next Steps:</h4>
          <ul className="text-yellow-700 space-y-1 text-sm">
            <li>• Build your first neighborhood</li>
            <li>• Experiment with different building layouts</li>
            <li>• Try to complete your first achievement</li>
            <li>• Explore the game wiki for more detailed information</li>
          </ul>
        </div>
        
        <div className="text-center">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg p-3">
            <Gift className="mx-auto mb-2" size={20} />
            <p className="font-semibold">Welcome Bonus: +200 Coins!</p>
            <p className="text-sm opacity-90">Use these to get started on your first buildings</p>
          </div>
        </div>
      </div>
    )
  }
];

export default function TutorialGuide({ step, onNextStep, onClose, onComplete }: TutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState(step);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  
  const currentTutorialStep = tutorialSteps[currentStep - 1];
  const isLastStep = currentStep >= tutorialSteps.length;
  
  useEffect(() => {
    setCurrentStep(step);
  }, [step]);
  
  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
      onNextStep();
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const handleSkipToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basics': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'building': return 'bg-green-100 text-green-800 border-green-200';
      case 'management': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'tips': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white/95 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 bg-opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30">
                    {currentTutorialStep?.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold drop-shadow-lg">{currentTutorialStep?.title}</h2>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm mt-1 border border-white/30`}>
                      {currentTutorialStep?.category.charAt(0).toUpperCase() + currentTutorialStep?.category.slice(1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-full h-3 overflow-hidden border border-white/30 shadow-inner">
              <div 
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${(currentStep / tutorialSteps.length) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-white/90 text-sm font-medium">
                Step {currentStep} of {tutorialSteps.length}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-white/70 text-xs">
                  {Math.round((currentStep / tutorialSteps.length) * 100)}% Complete
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentTutorialStep?.content}
                  
                  {currentTutorialStep?.tasks && (
                    <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                        <Target size={16} />
                        Try This Now:
                      </h4>
                      <ul className="space-y-2">
                        {currentTutorialStep.tasks.map((task, index) => (
                          <li key={index} className="flex items-center gap-3 text-indigo-700">
                            <div className="w-6 h-6 bg-indigo-200 rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="text-sm">{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          <div className="border-t border-white/20 p-6 bg-gradient-to-r from-gray-50 to-blue-50 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-5 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-xl hover:bg-white/50 backdrop-blur-sm border border-gray-200 font-medium"
              >
                <ArrowLeft size={18} />
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {tutorialSteps.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleSkipToStep(index + 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm ${
                      currentStep === index + 1
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white scale-110 shadow-lg'
                        : currentStep > index + 1
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 border border-gray-200'
                    }`}
                  >
                    {currentStep > index + 1 ? <CheckCircle size={16} /> : index + 1}
                  </button>
                ))}
                {tutorialSteps.length > 5 && (
                  <>
                    <span className="text-gray-400 mx-2 font-bold">•••</span>
                    <div className="px-3 py-2 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600 font-medium">
                        +{tutorialSteps.length - 5} more
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              <button
                onClick={handleNext}
                className={`flex items-center gap-3 px-8 py-3 rounded-xl transition-all duration-200 font-bold shadow-lg hover:scale-105 ${
                  isLastStep 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                }`}
              >
                {isLastStep ? 'Complete Tutorial' : 'Next Step'}
                {!isLastStep && <ArrowRight size={18} />}
                {isLastStep && <CheckCircle size={18} />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}