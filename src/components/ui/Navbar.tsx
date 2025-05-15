import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Trophy, User, Settings, LogOut, Home, PlusCircle, LogIn, CloudUpload, Shield } from 'lucide-react';

interface NavbarProps {
  onShowLeaderboard: () => void;
  onShowProfileSettings: () => void;
  onShowSecuritySettings: () => void;
  onShowLogin: () => void;
  onLogout: () => void;
  isInGame: boolean;
  onExitGame?: () => void;
  onStartFreshGame?: () => void;
}

export default function Navbar({
  onShowLeaderboard,
  onShowProfileSettings,
  onShowSecuritySettings,
  onShowLogin,
  onLogout,
  isInGame,
  onExitGame,
  onStartFreshGame
}: NavbarProps) {
  const { user, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const isGuest = !!user?.isGuest;
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-40 shadow-sm">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <div className="text-emerald-600 font-medium text-lg lowercase flex items-center">
            🏙️ neighborville
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onShowLeaderboard}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Leaderboard"
          >
            <Trophy size={20} className="text-amber-500" />
          </button>
          
          {isAuthenticated && !isGuest && onStartFreshGame && !isInGame && (
            <button
              onClick={onStartFreshGame}
              className="bg-amber-500 hover:bg-amber-600 text-white py-1 px-3 rounded-full text-sm transition-colors flex items-center gap-1"
              title="Start a fresh city"
            >
              <PlusCircle size={16} />
              <span>New City</span>
            </button>
          )}
          
          {isGuest && !isInGame && (
            <button
              onClick={onShowLogin}
              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded-full text-sm transition-colors flex items-center gap-1"
              title="Sign up to save your progress"
            >
              <CloudUpload size={16} />
              <span>Save Progress</span>
            </button>
          )}
          
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-1 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className={`w-8 h-8 ${isGuest ? 'bg-gray-100' : 'bg-emerald-100'} rounded-full flex items-center justify-center`}>
                  <User size={16} className={isGuest ? 'text-gray-500' : 'text-emerald-700'} />
                </div>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <div className="font-medium">
                      {user?.username}
                      {isGuest && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-1">Guest</span>}
                    </div>
                    {!isGuest && <div className="text-xs text-gray-500">{user?.email}</div>}
                    
                    {isGuest && (
                      <div className="mt-1 text-xs text-blue-500">
                        Sign up to save progress
                      </div>
                    )}
                  </div>
                  
                  {!isInGame && onStartFreshGame && !isGuest && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onStartFreshGame();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-amber-600 hover:bg-gray-100 flex items-center"
                    >
                      <PlusCircle size={16} className="mr-2" />
                      Start New City
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onShowProfileSettings();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <Settings size={16} className="mr-2" />
                    {isGuest ? 'Game Settings' : 'Profile Settings'}
                  </button>
                  
                  {!isGuest && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onShowSecuritySettings();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Shield size={16} className="mr-2" />
                      Security Settings
                    </button>
                  )}
                  
                  {isGuest && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onShowLogin();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 flex items-center"
                    >
                      <LogIn size={16} className="mr-2" />
                      Sign Up / Log In
                    </button>
                  )}
                  
                  {isInGame && onExitGame && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onExitGame();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Home size={16} className="mr-2" />
                      Exit to Menu
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    {isGuest ? 'Exit Game' : 'Log Out'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onShowLogin}
              className="bg-emerald-500 hover:bg-emerald-600 text-white py-1 px-3 rounded-full text-sm transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
} 