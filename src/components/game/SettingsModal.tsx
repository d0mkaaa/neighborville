import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, HelpCircle, Settings as SettingsIcon, Music } from "lucide-react";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  audioRef: React.RefObject<HTMLIFrameElement | HTMLAudioElement | null>;
  onShowTutorial: () => void;
  onShowStats: () => void;
};

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  musicEnabled, 
  onToggleMusic,
  audioRef,
  onShowTutorial,
  onShowStats
}: SettingsModalProps) {

  const handleMusicToggle = () => {
    onToggleMusic();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    
    if (audioRef.current && audioRef.current instanceof HTMLIFrameElement) {
      const widget = (window as any).SC?.Widget(audioRef.current);
      widget?.setVolume(newVolume * 100);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
              <h2 className="text-lg font-medium lowercase flex items-center">
                <SettingsIcon size={20} className="mr-2" />
                settings
              </h2>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 lowercase mb-3">music</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Music size={18} className="text-gray-500 mr-2" />
                      <span className="text-gray-700">background music</span>
                    </div>
                    <button
                      onClick={handleMusicToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        musicEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`${
                          musicEnabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                    </button>
                  </div>

                  {musicEnabled && (
                    <div className="flex items-center space-x-2">
                      <VolumeX size={16} className="text-gray-500" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        defaultValue="0.7"
                        onChange={handleVolumeChange}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <Volume2 size={16} className="text-gray-500" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 lowercase mb-3">help</h3>
                <div className="space-y-2">
                  <button
                    onClick={onShowTutorial}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <HelpCircle size={18} className="text-gray-500 mr-2" />
                      <span className="text-gray-700">view tutorial</span>
                    </div>
                    <span className="text-gray-400">↗</span>
                  </button>
                  
                  <button
                    onClick={onShowStats}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <SettingsIcon size={18} className="text-gray-500 mr-2" />
                      <span className="text-gray-700">player stats</span>
                    </div>
                    <span className="text-gray-400">↗</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Created with ❤️ for <a href="https://neighborhood.hackclub.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700">neighborhood.hackclub.com</a>
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}