import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, TrendingUp, Calendar, Home, Coins, Trophy, Zap, Droplets, Users, Building, Award, Activity, ChevronRight, Settings, Eye, EyeOff, Save, Shield, AlertCircle, LogIn } from "lucide-react";
import type { GameProgress, Achievement, Neighbor, Building as BuildingType } from "../../types/game";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

type PlayerStatsModalProps = {
  gameData: GameProgress;
  achievements: Achievement[];
  neighbors: Neighbor[];
  grid: (BuildingType | null)[];
  onClose: () => void;
  onShowLogin?: () => void;
};

interface ProfileSettings {
  visibility: 'public' | 'private';
  showBio: boolean;
  showStats: boolean;
  showActivity: boolean;
}

export default function PlayerStatsModal({ gameData, achievements, neighbors, grid, onClose, onShowLogin }: PlayerStatsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'profile'>('stats');
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
  const [showBio, setShowBio] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const isGuest = !!user?.isGuest;

  useEffect(() => {
    if (isGuest) {
      setActiveTab('stats');
    }
  }, [isGuest]);

  const completedAchievements = achievements.filter(a => a.completed).length;
  const totalXP = achievements.filter(a => a.completed).reduce((sum, a) => sum + a.xpReward, 0);
  const housedResidents = neighbors.filter(n => n.hasHome).length;
  const totalBuildings = grid.filter(b => b !== null).length;
  const gridUtilization = (totalBuildings / gameData.gridSize) * 100;
  
  const stats = [
    { label: 'Level', value: gameData.level, icon: <TrendingUp className="text-emerald-500" size={20} /> },
    { label: 'Experience', value: `${gameData.experience}/${gameData.level * 100}`, icon: <Activity className="text-blue-500" size={20} /> },
    { label: 'Days Survived', value: gameData.day, icon: <Calendar className="text-purple-500" size={20} /> },
    { label: 'Total Coins', value: gameData.coins, icon: <Coins className="text-yellow-500" size={20} /> },
    { label: 'Buildings', value: totalBuildings, icon: <Building className="text-indigo-500" size={20} /> },
    { label: 'Residents', value: housedResidents, icon: <Users className="text-orange-500" size={20} /> },
    { label: 'Happiness', value: `${Math.round(gameData.happiness)}%`, icon: <Users className="text-green-500" size={20} /> },
    { label: 'Achievements', value: `${completedAchievements}/${achievements.length}`, icon: <Trophy className="text-amber-500" size={20} /> },
    { label: 'Grid Size', value: `${Math.sqrt(gameData.gridSize)}×${Math.sqrt(gameData.gridSize)}`, icon: <Home className="text-gray-500" size={20} /> },
    { label: 'Total XP Earned', value: totalXP, icon: <Award className="text-purple-500" size={20} /> },
  ];

  const nextLevel = gameData.level + 1;
  const unlocksAtNextLevel = [
    { level: 2, unlock: 'More building options' },
    { level: 3, unlock: 'Fancy Restaurant' },
    { level: 4, unlock: 'Tech Hub' },
    { level: 5, unlock: 'Movie Theater & Special Neighbors' },
    { level: 6, unlock: 'Luxury Condos' },
    { level: 8, unlock: 'Expanded grid (5×5)' },
    { level: 12, unlock: 'Large grid (6×6)' },
    { level: 16, unlock: 'Huge grid (7×7)' },
    { level: 20, unlock: 'Maximum grid (8×8)' },
  ].find(item => item.level === nextLevel);

  useEffect(() => {
    const savedSettings = sessionStorage.getItem('profile_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setProfileVisibility(settings.visibility || 'public');
        setShowBio(settings.showBio !== undefined ? settings.showBio : true);
        setShowStats(settings.showStats !== undefined ? settings.showStats : true);
        setShowActivity(settings.showActivity !== undefined ? settings.showActivity : true);
      } catch (error) {
      }
    }
  }, []);

  const handleSaveSettings = () => {
    if (isGuest && onShowLogin) {
      onShowLogin();
      onClose();
      return;
    }
    
    setIsSaving(true);
    setErrorMessage(null);
    
    try {
      const settings = {
        visibility: profileVisibility,
        showBio,
        showStats,
        showActivity
      };
      
      sessionStorage.setItem('profile_settings', JSON.stringify(settings));
      
      setTimeout(() => {
        setIsSaving(false);
        setSaveSuccess(true);
        
        setTimeout(() => {
          setSaveSuccess(null);
        }, 3000);
      }, 800);
    } catch (error) {
      setIsSaving(false);
      setSaveSuccess(false);
      setErrorMessage('Failed to save settings. Please try again.');
    }
  };

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
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-medium lowercase">{gameData.playerName}</h2>
              <div className="text-sm text-white/80">
                Level {gameData.level} Mayor
                {isGuest && <span className="ml-2 bg-blue-600 text-white text-xs py-0.5 px-1.5 rounded">Guest</span>}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3 text-center text-sm font-medium ${
                activeTab === 'stats'
                  ? 'text-emerald-600 border-b-2 border-emerald-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Player Stats
            </button>
            {!isGuest && (
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-3 text-center text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'text-emerald-600 border-b-2 border-emerald-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile Settings
              </button>
            )}
          </div>
        </div>
        
        {isGuest && onShowLogin && (
          <div className="bg-blue-50 border-b border-blue-100 p-3">
            <div className="flex items-start">
              <div className="flex-1 text-center">
                <p className="text-xs text-blue-600">
                  Create an account to access profile settings and save your progress to the cloud.
                </p>
                <button 
                  onClick={() => {
                    onShowLogin();
                    onClose();
                  }}
                  className="mt-2 bg-blue-500 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-blue-600 transition-colors mx-auto"
                >
                  <LogIn size={14} />
                  Sign Up / Log In
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 rounded-lg p-4 flex items-center"
                >
                  <div className="mr-3 p-2 bg-white rounded-lg shadow-sm">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">{stat.label}</div>
                    <div className="text-lg font-semibold text-gray-800">{stat.value}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 lowercase">progress overview</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Experience to Level {gameData.level + 1}</span>
                    <span>{gameData.experience}/{gameData.level * 100} XP</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(gameData.experience / (gameData.level * 100)) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Grid Utilization</span>
                    <span>{Math.round(gridUtilization)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${gridUtilization}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Achievement Progress</span>
                    <span>{completedAchievements}/{achievements.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedAchievements / achievements.length) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {unlocksAtNextLevel && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3 lowercase">next level unlock</h3>
                <div className="bg-emerald-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                      <ChevronRight size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-emerald-800">Level {unlocksAtNextLevel.level}</div>
                      <div className="text-xs text-emerald-600">{unlocksAtNextLevel.unlock}</div>
                    </div>
                  </div>
                  <div className="text-xs text-emerald-600">
                    {gameData.level * 100 - gameData.experience} XP to go
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!isGuest && activeTab === 'profile' && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-100px)]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {user?.username ? user.username[0].toUpperCase() : gameData.playerName[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{user?.username || gameData.playerName}</h3>
                <p className="text-gray-500">Username cannot be changed</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Shield size={18} />
                Privacy Settings
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {profileVisibility === 'public' ? (
                      <Eye size={18} className="text-green-600" />
                    ) : (
                      <EyeOff size={18} className="text-gray-600" />
                    )}
                    <span>Profile Visibility</span>
                  </div>
                  <div>
                    <select
                      value={profileVisibility}
                      onChange={(e) => setProfileVisibility(e.target.value as 'public' | 'private')}
                      className="p-2 border border-gray-300 rounded-md"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
                
                {profileVisibility === 'public' && (
                  <div className="pl-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Show Bio</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showBio}
                          onChange={() => setShowBio(!showBio)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Show Stats</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showStats}
                          onChange={() => setShowStats(!showStats)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Show Activity</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={showActivity}
                          onChange={() => setShowActivity(!showActivity)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {saveSuccess === true && (
              <div className="p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                Settings saved successfully!
              </div>
            )}
            
            {saveSuccess === false && errorMessage && (
              <div className="p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle size={16} />
                {errorMessage}
              </div>
            )}

            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className={`w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 ${
                isSaving ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Settings
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}