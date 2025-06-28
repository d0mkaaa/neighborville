import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'warning' | 'info' | 'glass' | 'gradient' | 'neon';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  rounded?: boolean;
  shadow?: boolean;
  glow?: boolean;
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  rounded = false,
  shadow = true,
  glow = false,
}: ButtonProps) {
  
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border border-emerald-500/20';
      case 'secondary':
        return 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 border border-gray-300';
      case 'outline':
        return 'bg-transparent border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-600';
      case 'ghost':
        return 'bg-transparent hover:bg-gray-100 text-gray-700 hover:text-gray-900 border border-transparent';
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border border-green-500/20';
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border border-red-500/20';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border border-yellow-500/20';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border border-blue-500/20';
      case 'glass':
        return 'bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 shadow-lg';
      case 'gradient':
        return 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white border border-purple-500/20';
      case 'neon':
        return 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border border-cyan-500/20 shadow-lg shadow-cyan-500/25';
      default:
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border border-emerald-500/20';
    }
  };

  const getSizeStyles = (): string => {
    switch (size) {
      case 'xs':
        return 'text-xs py-1 px-2 min-h-[24px]';
      case 'sm':
        return 'text-sm py-1.5 px-3 min-h-[32px]';
      case 'md':
        return 'text-sm py-2 px-4 min-h-[40px]';
      case 'lg':
        return 'text-base py-2.5 px-6 min-h-[44px]';
      case 'xl':
        return 'text-lg py-3 px-8 min-h-[48px]';
      default:
        return 'text-sm py-2 px-4 min-h-[40px]';
    }
  };

  const getShadowStyles = (): string => {
    if (!shadow) return '';
    
    switch (variant) {
      case 'primary':
        return 'shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30';
      case 'success':
        return 'shadow-md shadow-green-500/25 hover:shadow-lg hover:shadow-green-500/30';
      case 'danger':
        return 'shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30';
      case 'warning':
        return 'shadow-md shadow-yellow-500/25 hover:shadow-lg hover:shadow-yellow-500/30';
      case 'info':
        return 'shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30';
      case 'gradient':
        return 'shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30';
      case 'neon':
        return 'shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/40';
      case 'glass':
        return 'shadow-lg backdrop-blur-md';
      default:
        return 'shadow-md hover:shadow-lg';
    }
  };

  const getGlowStyles = (): string => {
    if (!glow) return '';
    
    switch (variant) {
      case 'neon':
        return 'hover:shadow-cyan-400/50 hover:shadow-2xl';
      case 'gradient':
        return 'hover:shadow-purple-400/50 hover:shadow-2xl';
      default:
        return 'hover:shadow-emerald-400/50 hover:shadow-xl';
    }
  };

  const baseClasses = `
    font-medium
    ${rounded ? 'rounded-full' : 'rounded-lg'}
    transition-all
    duration-300
    ease-in-out
    flex
    items-center
    justify-center
    gap-2
    relative
    overflow-hidden
    transform-gpu
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0'}
    ${fullWidth ? 'w-full' : ''}
    ${getShadowStyles()}
    ${getGlowStyles()}
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500/50
  `;

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.98, y: 0 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <button
        className={`${baseClasses} ${getVariantStyles()} ${getSizeStyles()} ${className}`}
        onClick={!disabled ? onClick : undefined}
        disabled={disabled || loading}
        type={type}
      >
        <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10 flex items-center gap-2">
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          
          {!loading && icon && iconPosition === 'left' && (
            <span className="flex items-center">{icon}</span>
          )}
          
          {children && (
            <span className="font-medium">{children}</span>
          )}
          
          {!loading && icon && iconPosition === 'right' && (
            <span className="flex items-center">{icon}</span>
          )}
        </div>
      </button>
    </motion.div>
  );
}