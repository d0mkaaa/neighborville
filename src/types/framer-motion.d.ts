declare module 'framer-motion' {
  import { HTMLAttributes, ButtonHTMLAttributes, AnchorHTMLAttributes, ComponentPropsWithoutRef } from 'react';
  
  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    layout?: any;
    layoutId?: string;
    style?: React.CSSProperties;
    onClick?: (event: any) => void;
    className?: string;
    onHoverStart?: () => void;
    onHoverEnd?: () => void;
    onAnimationComplete?: () => void;
  }
  
  export const motion: {
    div: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'div'> & MotionProps>;
    button: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'button'> & MotionProps>;
    h1: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'h1'> & MotionProps>;
    span: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'span'> & MotionProps>;
    a: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'a'> & MotionProps>;
    p: React.ForwardRefExoticComponent<ComponentPropsWithoutRef<'p'> & MotionProps>;
  };
  
  export type HTMLMotionProps<T = HTMLElement> = ComponentPropsWithoutRef<'div'> & MotionProps;
  
  export const AnimatePresence: React.ComponentType<{
    children: React.ReactNode;
    mode?: 'wait' | 'sync';
    initial?: boolean;
  }>;
} 