import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import type { CoinHistoryEntry } from "../../types/game";

type CoinHistoryProps = {
  history: CoinHistoryEntry[];
  onClose: () => void;
};

export default function CoinHistory({ history, onClose }: CoinHistoryProps) {
  const recentEntries = history.slice(-20).reverse();
  
  const totalIncome = history.reduce((sum, entry) => entry.type === 'income' ? sum + entry.amount : sum, 0);
  const totalExpenses = history.reduce((sum, entry) => entry.type === 'expense' ? sum + entry.amount : sum, 0);
  const netGain = totalIncome - totalExpenses;
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium lowercase flex items-center">
            <DollarSign size={20} className="mr-2" />
            coin history
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-emerald-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-50 p-3 rounded-lg text-center">
              <div className="text-xs text-emerald-700 uppercase">total income</div>
              <div className="text-lg font-medium text-emerald-600">{totalIncome} coins</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg text-center">
              <div className="text-xs text-red-700 uppercase">total expenses</div>
              <div className="text-lg font-medium text-red-600">{totalExpenses} coins</div>
            </div>
            <div className={`p-3 rounded-lg text-center ${netGain >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-xs uppercase ${netGain >= 0 ? 'text-green-700' : 'text-red-700'}`}>net gain</div>
              <div className={`text-lg font-medium ${netGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netGain >= 0 ? '+' : ''}{netGain} coins
              </div>
            </div>
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[calc(80vh-250px)]">
            <h3 className="text-sm font-medium text-gray-700 lowercase mb-3">recent transactions</h3>
            {recentEntries.map((entry, index) => (
              <motion.div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center">
                  <Calendar size={16} className="text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      Day {entry.day} - {formatDate(entry.timestamp)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Balance: {entry.balance} coins
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="text-xs mb-1 text-gray-500">{entry.description}</div>
                  {entry.type === 'income' && (
                    <div className="flex items-center text-green-600">
                      <TrendingUp size={14} className="mr-1" />
                      <span className="text-sm">+{entry.amount}</span>
                    </div>
                  )}
                  {entry.type === 'expense' && (
                    <div className="flex items-center text-red-600">
                      <TrendingDown size={14} className="mr-1" />
                      <span className="text-sm">-{entry.amount}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            
            {recentEntries.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No transaction history yet
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}