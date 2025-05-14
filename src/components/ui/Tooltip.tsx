import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  width?: string;
}

export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  width = 'auto'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const getPosition = () => {
    switch (position) {
      case 'top':
        return { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
      case 'bottom':
        return { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { right: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' };
      case 'right':
        return { left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' };
      default:
        return { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 bg-gray-800 text-white text-xs py-1.5 px-2.5 rounded shadow-lg whitespace-nowrap"
            style={{ 
              ...getPosition(),
              width: width !== 'auto' ? width : 'auto',
              maxWidth: '250px'
            }}
          >
            {content}
            <div 
              className="absolute w-2 h-2 bg-gray-800 transform rotate-45"
              style={{
                ...(position === 'top' ? { bottom: '-4px', left: 'calc(50% - 4px)' } :
                   position === 'bottom' ? { top: '-4px', left: 'calc(50% - 4px)' } :
                   position === 'left' ? { right: '-4px', top: 'calc(50% - 4px)' } :
                   { left: '-4px', top: 'calc(50% - 4px)' })
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
