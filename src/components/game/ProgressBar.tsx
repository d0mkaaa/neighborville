import { motion } from "framer-motion";

type ProgressBarProps = {
  value: number;
  maxValue: number;
  width?: number;
  height?: number;
  showText?: boolean;
  textPosition?: 'inside' | 'right';
  color?: string;
  bgColor?: string;
};

export default function ProgressBar({
  value,
  maxValue,
  width = 100,
  height = 8,
  showText = false,
  textPosition = 'right',
  color = "#10b981",
  bgColor = "#e5e7eb"
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  return (
    <div className="flex items-center">
      <div 
        className="relative rounded-full overflow-hidden"
        style={{ width, height, backgroundColor: bgColor }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute top-0 left-0 h-full"
          style={{ 
            backgroundColor: color,
            backgroundImage: `linear-gradient(90deg, ${color}dd, ${color})` 
          }}
        />
        
        {showText && textPosition === 'inside' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-white font-medium">
              {value}/{maxValue}
            </span>
          </div>
        )}
      </div>
      
      {showText && textPosition === 'right' && (
        <span className="ml-2 text-xs text-gray-600">
          {value}/{maxValue}
        </span>
      )}
    </div>
  );
}