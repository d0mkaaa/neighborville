import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, TrendingUp, TrendingDown, Users, Home, DollarSign } from "lucide-react";

type DayRecord = {
  day: number;
  coins: number;
  happiness: number;
  residents: number;
  buildings: number;
  income: number;
  expenses: number;
  events: { name: string; type: 'good' | 'bad' | 'neutral' }[];
};

type CalendarViewProps = {
  dayRecords: DayRecord[];
  currentDay: number;
  onClose: () => void;
};

export default function CalendarView({ dayRecords, currentDay, onClose }: CalendarViewProps) {
  const getDayStats = (day: number) => {
    const record = dayRecords.find(r => r.day === day);
    if (!record) return null;
    
    const profit = record.income - record.expenses;
    const nextDayRecord = dayRecords.find(r => r.day === day + 1);
    const happinessChange = nextDayRecord ? nextDayRecord.happiness - record.happiness : 0;
    
    return {
      ...record,
      profit,
      happinessChange
    };
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
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium lowercase flex items-center">
            <Calendar size={20} className="mr-2" />
            history (day {currentDay})
          </h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-100px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayRecords.map(record => {
              const stats = getDayStats(record.day);
              if (!stats) return null;
              
              return (
                <motion.div
                  key={record.day}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-lg border ${
                    record.day === currentDay 
                      ? 'border-emerald-300 bg-emerald-50' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-800">Day {record.day}</h3>
                    <div className={`text-sm font-medium ${
                      stats.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats.profit >= 0 ? '+' : ''}{stats.profit} coins
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-xs text-gray-500">coins</div>
                      <div className="text-sm font-medium">{record.coins}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-xs text-gray-500">happiness</div>
                      <div className="text-sm font-medium flex items-center justify-center">
                        {record.happiness}%
                        {stats.happinessChange !== 0 && (
                          <span className={`ml-1 text-xs ${
                            stats.happinessChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stats.happinessChange > 0 ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-xs text-gray-500">residents</div>
                      <div className="text-sm font-medium">{record.residents}</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-xs text-gray-500">buildings</div>
                      <div className="text-sm font-medium">{record.buildings}</div>
                    </div>
                  </div>
                  
                  {record.events.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">events</div>
                      <div className="space-y-1">
                        {record.events.map((event, idx) => (
                          <div key={idx} className="flex items-center text-xs">
                            <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              event.type === 'good' ? 'bg-green-500' :
                              event.type === 'bad' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`} />
                            <span className="text-gray-600">{event.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          {dayRecords.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No historical data available yet
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}