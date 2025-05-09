import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'danger' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends HTMLMotionProps<"button"> {
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
  ...props 
}: ButtonProps) {
  
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'primary':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md';
      case 'secondary':
        return 'bg-gray-200 hover:bg-gray-300 text-gray-800';
      case 'outline':
        return 'bg-transparent border border-emerald-500 text-emerald-500 hover:bg-emerald-50';
      case 'ghost':
        return 'bg-transparent hover:bg-gray-100 text-gray-800';
      case 'success':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white shadow-md';
      case 'glass':
        return 'bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg hover:bg-opacity-20 text-white border border-white border-opacity-20 shadow-md';
      default:
        return 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md';
    }
  };

  const getSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'text-xs py-1.5 px-3';
      case 'md':
        return 'text-sm py-2 px-4';
      case 'lg':
        return 'text-base py-3 px-6';
      default:
        return 'text-sm py-2 px-4';
    }
  };

  const baseClasses = `
    font-medium
    rounded-lg
    transition-all
    duration-200
    flex
    items-center
    justify-center
    lowercase
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${fullWidth ? 'w-full' : ''}
  `;

  return (
    <motion.button
      className={`${baseClasses} ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      whileHover={!disabled ? { scale: 1.03 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      onClick={!disabled ? onClick : undefined}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2 flex items-center">{icon}</span>
      )}
      
      {children}
      
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2 flex items-center">{icon}</span>
      )}
    </motion.button>
  );
}