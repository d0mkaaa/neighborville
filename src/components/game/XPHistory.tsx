import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Star, Trophy, Building, Zap, Gift } from "lucide-react";
import type { XPLogEntry } from "../../types/game";

type XPHistoryProps = {
  history: XPLogEntry[];
  onClose: () => void;
};

export default function XPHistory({ history, onClose }: XPHistoryProps) {
  const recentEntries = history.slice(-20).reverse();
  
  const totalXP = history.reduce((sum, entry) => sum + entry.amount, 0);
  
  const sourceStats = history.reduce((stats, entry) => {
    if (!stats[entry.source]) {
      stats[entry.source] = { count: 0, total: 0 };
    }
    stats[entry.source].count++;
    stats[entry.source].total += entry.amount;
    return stats;
  }, {} as Record<string, { count: number; total: number }>);
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'achievement':
        return <Trophy size={16} className="text-yellow-500" />;
      case 'building':
        return <Building size={16} className="text-blue-500" />;
      case 'event':
        return <Zap size={16} className="text-purple-500" />;
      case 'bonus':
        return <Gift size={16} className="text-green-500" />;
      default:
        return <Star size={16} className="text-gray-500" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'achievement':
        return 'text-yellow-600';
      case 'building':
        return 'text-blue-600';
      case 'event':
        return 'text-purple-600';
      case 'bonus':
        return 'text-green-600';
      default:
        return 'text-gray-600';
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
        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium lowercase flex items-center">
            <Star size={20} className="mr-2" />
            xp history
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-indigo-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-indigo-50 p-3 rounded-lg text-center">
              <div className="text-xs text-indigo-700 uppercase">total xp</div>
              <div className="text-lg font-medium text-indigo-600">{totalXP} XP</div>
            </div>
            
            {Object.entries(sourceStats).map(([source, stats]) => (
              <div key={source} className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-xs text-gray-700 uppercase">{source}</div>
                <div className="text-sm font-medium text-gray-600">{stats.total} XP</div>
                <div className="text-xs text-gray-500">({stats.count} times)</div>
              </div>
            ))}
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[calc(80vh-250px)]">
            <h3 className="text-sm font-medium text-gray-700 lowercase mb-3">recent xp gains</h3>
            {recentEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    {getSourceIcon(entry.source)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Day {entry.day} - {formatDate(entry.timestamp)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {entry.description}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className={`text-xs mb-1 capitalize ${getSourceColor(entry.source)}`}>
                    {entry.source}
                  </div>
                  <div className="flex items-center text-indigo-600">
                    <Star size={14} className="mr-1" />
                    <span className="text-sm font-medium">+{entry.amount} XP</span>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {recentEntries.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Star size={32} className="mx-auto mb-2 text-gray-300" />
                <div>No XP history yet</div>
                <div className="text-xs mt-1">Complete achievements to start gaining experience!</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
