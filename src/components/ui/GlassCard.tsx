import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type GlassCardVariant = 'primary' | 'secondary' | 'dark' | 'success' | 'warning' | 'danger';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: GlassCardVariant;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ 
  children, 
  variant = 'primary', 
  hover = false,
  className = '',
  onClick,
  ...props 
}: GlassCardProps) {
  
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'primary':
        return 'bg-white bg-opacity-10 border-white border-opacity-20 text-white';
      case 'secondary':
        return 'bg-gray-900 bg-opacity-5 border-gray-200 border-opacity-30 text-gray-900';
      case 'dark':
        return 'bg-gray-900 bg-opacity-70 border-gray-800 text-white';
      case 'success':
        return 'bg-emerald-500 bg-opacity-10 border-emerald-300 border-opacity-30 text-white';
      case 'warning':
        return 'bg-amber-500 bg-opacity-10 border-amber-300 border-opacity-30 text-white';
      case 'danger':
        return 'bg-red-500 bg-opacity-10 border-red-300 border-opacity-30 text-white';
      default:
        return 'bg-white bg-opacity-10 border-white border-opacity-20 text-white';
    }
  };

  const baseClasses = `
    backdrop-filter backdrop-blur-lg
    rounded-xl border
    shadow-lg
    transition-all duration-300 ease-in-out
    overflow-hidden
  `;
  
  const hoverClasses = hover ? `
    hover:scale-[1.02]
    hover:shadow-xl
    ${variant === 'primary' ? 'hover:bg-opacity-15' : ''}
    ${variant === 'secondary' ? 'hover:bg-opacity-10' : ''}
    ${variant === 'dark' ? 'hover:bg-opacity-80' : ''}
    ${variant === 'success' ? 'hover:bg-opacity-15' : ''}
    ${variant === 'warning' ? 'hover:bg-opacity-15' : ''}
    ${variant === 'danger' ? 'hover:bg-opacity-15' : ''}
    cursor-pointer
  ` : '';

  return (
    <motion.div
      className={`${baseClasses} ${getVariantStyles()} ${hoverClasses} ${className}`}
      whileTap={hover ? { scale: 0.98 } : undefined}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.div>
  );
}