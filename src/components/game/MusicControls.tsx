import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Music, Pause, Play } from "lucide-react";

type MusicControlsProps = {
  audioRef: React.RefObject<HTMLIFrameElement | HTMLAudioElement | null>;
  musicEnabled: boolean;
  onToggleMusic: () => void;
};

export default function MusicControls({ audioRef, musicEnabled, onToggleMusic }: MusicControlsProps) {
  const [isPlaying, setIsPlaying] = useState(musicEnabled);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    if (musicEnabled && audioRef.current instanceof HTMLIFrameElement) {
      const widget = (window as any).SC?.Widget(audioRef.current);
      
      widget?.bind((window as any).SC?.Widget.Events.READY, () => {
        setWidgetReady(true);
        widget.setVolume(volume * 100);
        
        widget.bind((window as any).SC?.Widget.Events.PLAY, () => {
          setIsPlaying(true);
        });
        
        widget.bind((window as any).SC?.Widget.Events.PAUSE, () => {
          setIsPlaying(false);
        });
        
        widget.bind((window as any).SC?.Widget.Events.FINISH, () => {
          widget.play();
        });
      });
    }
  }, [musicEnabled, audioRef]);

  const togglePlayPause = () => {
    if (audioRef.current && audioRef.current instanceof HTMLIFrameElement) {
      const widget = (window as any).SC?.Widget(audioRef.current);
      if (isPlaying) {
        widget?.pause();
      } else {
        widget?.play();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current && audioRef.current instanceof HTMLIFrameElement) {
      const widget = (window as any).SC?.Widget(audioRef.current);
      widget?.setVolume(newVolume * 100);
    }
  };

  const toggleMute = () => {
    if (audioRef.current && audioRef.current instanceof HTMLIFrameElement) {
      const widget = (window as any).SC?.Widget(audioRef.current);
      if (isMuted) {
        widget?.setVolume(volume * 100);
        setIsMuted(false);
      } else {
        widget?.setVolume(0);
        setIsMuted(true);
      }
    }
  };

  const handleDisableMusic = () => {
    onToggleMusic();
  };

  if (!musicEnabled) return null;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ position: 'fixed' }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setTimeout(() => setShowControls(false), 2000);
        }
      }}
    >
      <div className="relative">
        <motion.div 
          className="bg-white/90 backdrop-blur-md rounded-full p-3 shadow-lg border border-white/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button 
            onClick={togglePlayPause}
            className="flex items-center justify-center text-emerald-600"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
        </motion.div>

        {showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-full right-0 mb-3 bg-white/95 backdrop-blur-md rounded-lg p-4 shadow-xl border border-white/20 min-w-[200px]"
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={toggleMute}
                  className={`p-2 rounded-full transition-colors ${
                    isMuted 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  }`}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button
                  onClick={handleDisableMusic}
                  className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Music size={18} />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <VolumeX size={16} className="text-gray-500" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
                  }}
                />
                <Volume2 size={16} className="text-gray-500" />
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                {isPlaying ? 'Now Playing' : 'Paused'}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}