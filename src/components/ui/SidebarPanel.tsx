import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarPanelProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  summary?: React.ReactNode;
  panelColor?: 'default' | 'dark';
}

export default function SidebarPanel({
  title,
  icon,
  children,
  initiallyExpanded = true,
  summary,
  panelColor = 'default'
}: SidebarPanelProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  
  const getPanelColorClass = () => {
    switch (panelColor) {
      case 'dark':
        return 'bg-navy-900';
      case 'default':
      default:
        return 'bg-white';
    }
  };
  
  return (
    <div className={`rounded-xl shadow-sm overflow-hidden mb-3 ${getPanelColorClass()}`}>
      <div 
        className="p-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <div className="mr-2 flex-shrink-0">
            {icon}
          </div>
          <div>
            <h3 className={`font-medium lowercase text-sm ${panelColor === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {title}
            </h3>
            {summary && (
              <div className={`text-xs ${panelColor === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {summary}
              </div>
            )}
          </div>
        </div>
        <div>
          {isExpanded ? (
            <ChevronUp size={16} className={panelColor === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
          ) : (
            <ChevronDown size={16} className={panelColor === 'dark' ? 'text-gray-400' : 'text-gray-500'} />
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}