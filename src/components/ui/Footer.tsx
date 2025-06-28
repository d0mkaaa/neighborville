import React, { useState, useEffect } from 'react';
import { Github, Heart, Code, Globe, Zap, Cloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCurrentVersion, fetchVersionFromAPI, type VersionInfo } from '../../services/versionService';

export default function Footer() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>(getCurrentVersion());
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const liveVersion = await fetchVersionFromAPI();
        setVersionInfo(liveVersion);
        setIsLive(true);
      } catch {
        setVersionInfo(getCurrentVersion());
        setIsLive(false);
      }
    };

    loadVersionInfo();
  }, []);

  return (
    <footer className="relative">
      <div className="absolute inset-0 bg-black/5 backdrop-blur-md border-t border-white/10" />
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center space-x-1 text-gray-700">
                <span>Created with</span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Heart size={14} className="text-red-500" />
                </motion.div>
                <span>by</span>
                <a 
                  href="https://github.com/d0mkaaa" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  d0mkaaa
                </a>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-100 rounded-full">
                  <Globe size={12} className="text-emerald-600" />
                  <span className="text-emerald-700 font-medium text-xs">
                    {versionInfo.version}
                  </span>
                  {isLive && (
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 bg-green-500 rounded-full"
                    />
                  )}
                </div>
                
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
                  <Code size={12} className="text-blue-600" />
                  <span className="text-blue-700 font-medium text-xs">React + TypeScript</span>
                </div>
                
                {isLive && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 rounded-full">
                    <Cloud size={12} className="text-purple-600" />
                    <span className="text-purple-700 font-medium text-xs">Live GitHub</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-1 text-gray-600 text-xs">
                <Zap size={12} />
                <span>City Building • Economy Sim • Leaderboards • Cloud Saves</span>
              </div>
              
              <motion.a 
                href="https://github.com/d0mkaaa/neighborville" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Github size={16} />
                <span>Source</span>
              </motion.a>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-white/10 text-center text-xs text-gray-500">
            <span>© 2025 NeighborVille • Built for </span>
            <a 
              href="https://neighborhood.hackclub.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              neighborhood.hackclub.com
            </a>
            <span> • {versionInfo.environment === 'production' ? 'Production' : 'Development'} Build</span>
          </div>
        </div>
      </div>
    </footer>
  );
}