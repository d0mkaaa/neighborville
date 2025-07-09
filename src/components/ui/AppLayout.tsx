import React from 'react';
import Footer from './Footer';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

interface AppLayoutProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  showFooter?: boolean;
  showNavbar?: boolean;
  timeOfDay?: 'morning' | 'day' | 'evening' | 'night';
  onShowLeaderboard?: () => void;
  onShowProfileSettings?: () => void;
  onShowSecuritySettings?: () => void;
  onShowLogin?: () => void;
  onLogout?: () => void;
  isInGame?: boolean;
  onExitGame?: () => void;
  onStartFreshGame?: () => void;
}

export default function AppLayout({ 
  header, 
  children, 
  showFooter = true,
  showNavbar = true,
  timeOfDay = 'day',
  onShowLeaderboard = () => {},
  onShowProfileSettings = () => {},
  onShowSecuritySettings = () => {},
  onShowLogin = () => {},
  onLogout = () => {},
  isInGame = false,
  onExitGame,
  onStartFreshGame
}: AppLayoutProps) {
  const { logout } = useAuth();
  
  const getBackgroundGradient = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'from-amber-100/80 via-yellow-100/80 to-emerald-100/80';
      case 'day':
        return 'from-emerald-100/80 via-cyan-100/80 to-blue-100/80';
      case 'evening':
        return 'from-orange-100/80 via-red-100/80 to-purple-100/80';
      case 'night':
        return 'from-indigo-200/80 via-purple-200/80 to-slate-200/80';
      default:
        return 'from-emerald-100/80 via-cyan-100/80 to-blue-100/80';
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className={`absolute inset-0 bg-gradient-to-br ${getBackgroundGradient()}`}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2310b981" fill-opacity="0.03"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            animation: 'patternMove 20s linear infinite'
          }}
        />
      </motion.div>

      <div className="relative z-10 h-full w-full flex flex-col">
        {header && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="sticky top-0 z-20"
          >
            {header}
          </motion.div>
        )}
        
        <main className="flex-grow w-full">
          {children}
        </main>
        
        {showFooter && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-20"
          >
            <Footer />
          </motion.div>
        )}
      </div>
    </div>
  );
}