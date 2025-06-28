import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, AlertCircle, Loader2, Home, Building2, Trophy, Activity, BarChart3 } from 'lucide-react';

type PublicProfileModalProps = {
  onClose: () => void;
  profile?: any;
  userId?: string;
  username?: string;
};

export default function PublicProfileModal({ onClose, profile, userId, username }: PublicProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);

  const profileName = username || profile?.username || 'Unknown Player';

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Profile</h3>
            <p className="text-gray-600 text-center">Please wait...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-4 bg-red-500 text-white flex justify-between items-center rounded-t-xl">
            <h2 className="text-lg font-medium">Error</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 text-center">
            <AlertCircle size={48} className="text-red-500 mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Profile</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isPrivate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="p-4 bg-gray-500 text-white flex justify-between items-center rounded-t-xl">
            <h2 className="text-lg font-medium">Private Profile</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-8 text-center">
            <Lock size={40} className="text-gray-400 mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{profileName}</h3>
            <p className="text-gray-500">This profile is set to private</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                {profileName[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold">{profileName}'s Profile</h2>
                <p className="text-blue-100 text-sm">@{profileName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center py-12">
            <Home size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Coming Soon</h3>
            <p className="text-gray-600">Public profiles are being developed</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
