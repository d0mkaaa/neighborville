import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, ChevronDown, ChevronUp, DollarSign, Check, X } from "lucide-react";
import type { Bill } from "../../types/game";

type BillsPanelProps = {
  bills: Bill[];
  onPayBill: (billId: string) => void;
  coins: number;
  currentDay: number;
};

export default function BillsPanel({
  bills,
  onPayBill,
  coins,
  currentDay
}: BillsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const unpaidBills = bills.filter(bill => !bill.isPaid);
  const paidBills = bills.filter(bill => bill.isPaid);
  
  const upcomingBills = unpaidBills.filter(bill => bill.dayDue > currentDay);
  const dueBills = unpaidBills.filter(bill => bill.dayDue <= currentDay);
  
  const totalDue = dueBills.reduce((sum, bill) => sum + bill.amount, 0);
  const hasDueBills = dueBills.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <motion.div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              hasDueBills ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <FileText size={16} />
            </div>
            <div>
              <h3 className="font-medium lowercase text-gray-800">bills</h3>
              <div className="text-xs text-gray-500 lowercase flex items-center">
                {hasDueBills ? (
                  <span className="text-red-500 font-medium">{dueBills.length} due now • {totalDue} coins</span>
                ) : (
                  <span>{unpaidBills.length} upcoming • {paidBills.length} paid</span>
                )}
              </div>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </motion.div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 border-t border-gray-100 bg-gray-50"
          >
            {dueBills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-600 my-2 lowercase">due now</h4>
                <div className="space-y-2 mb-3">
                  {dueBills.map(bill => (
                    <div key={bill.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-2">
                          {bill.icon === 'Energy' ? <Zap size={14} /> : <FileText size={14} />}
                        </div>
                        <div>
                          <div className="text-sm text-gray-700 lowercase">{bill.name}</div>
                          <div className="text-xs text-gray-500">due on day {bill.dayDue} (today is day {currentDay})</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-700">{bill.amount} coins</div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPayBill(bill.id);
                          }}
                          disabled={coins < bill.amount}
                          className={`px-2 py-1 rounded-md text-xs ${
                            coins >= bill.amount
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {coins >= bill.amount ? 'Pay' : 'Not enough'}
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {upcomingBills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-blue-600 my-2 lowercase">upcoming bills</h4>
                <div className="space-y-2 mb-3">
                  {upcomingBills.map(bill => (
                    <div key={bill.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2">
                          {bill.icon === 'Energy' ? <Zap size={14} /> : <FileText size={14} />}
                        </div>
                        <div>
                          <div className="text-sm text-gray-700 lowercase">{bill.name}</div>
                          <div className="text-xs text-gray-500">due in {bill.dayDue - currentDay} days</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-700">{bill.amount} coins</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {paidBills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-600 my-2 lowercase">paid bills</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {paidBills.map(bill => (
                    <div key={bill.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200 opacity-70">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2">
                          <Check size={14} />
                        </div>
                        <div>
                          <div className="text-sm text-gray-700 lowercase">{bill.name}</div>
                          <div className="text-xs text-gray-500">paid on day {bill.dayDue}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-green-600">{bill.amount} coins</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {bills.length === 0 && (
              <div className="p-3 text-center text-gray-500 lowercase">
                no bills at the moment
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Zap(props: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={props.size}
      height={props.size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  );
}