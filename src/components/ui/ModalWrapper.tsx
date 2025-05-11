import { motion, AnimatePresence, type HTMLMotionProps } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalWrapperProps extends HTMLMotionProps<"div"> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  headerColor?: 'primary' | 'secondary' | 'glass';
  showCloseButton?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export default function ModalWrapper({
  isOpen,
  onClose,
  children,
  title,
  headerColor = 'primary',
  showCloseButton = true,
  maxWidth = 'md',
  className = '',
  ...props
}: ModalWrapperProps) {
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      default: return 'max-w-md';
    }
  };

  const getHeaderClasses = () => {
    switch (headerColor) {
      case 'primary':
        return 'bg-emerald-600 text-white';
      case 'secondary':
        return 'bg-gray-100 text-gray-800';
      case 'glass':
        return 'bg-white/80 backdrop-blur-md text-gray-800 border-b border-gray-200';
      default:
        return 'bg-emerald-600 text-white';
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
            className={`bg-white rounded-xl shadow-xl ${getMaxWidthClass()} w-full overflow-hidden ${className}`}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {title && (
              <div className={`p-4 flex justify-between items-center ${getHeaderClasses()}`}>
                <h2 className="text-lg font-medium lowercase">
                  {title}
                </h2>
                {showCloseButton && (
                  <button 
                    onClick={onClose}
                    className="transition-colors"
                    style={{ opacity: headerColor === 'primary' ? 0.8 : 0.6 }}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}
            
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}