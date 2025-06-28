import { Cloud, Trash, Play, ChevronRight, CheckCircle2, Calendar, Coins, Smile, CloudOff } from 'lucide-react';
import Button from './Button';
import type { GameProgress } from '../../types/game';

interface SaveItemProps {
  save: {
    id: string;
    name: string;
    date: string;
    isAutoSave?: boolean;
    data: GameProgress;
    type?: 'cloud';
    timestamp?: number;
  };
  onLoad: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  showSelection?: boolean;
}

const SaveItem: React.FC<SaveItemProps> = ({
  save,
  onLoad,
  onDelete,
  isSelected = false,
  onToggleSelect,
  showSelection = false
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showSelection && onToggleSelect) {
      onToggleSelect();
    } else {
      onLoad();
    }
  };
  
  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect();
    }
  };

  const saveId = save.id;
  
  return (
    <div 
      className={`
        relative flex flex-col p-3 rounded-lg
        transition-all duration-200 cursor-pointer
        ${isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-white/70 hover:bg-white border border-gray-200'}
        ${save.isAutoSave ? 'border-l-4 border-amber-400' : 'border-l-4 border-blue-500'}
        shadow-sm
      `}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1">
            {save.isAutoSave ? (
              <span className="text-amber-500 text-xs px-1.5 py-0.5 bg-amber-50 rounded-full">
                auto
              </span>
            ) : (
              <span className="text-blue-600 text-xs px-1.5 py-0.5 bg-blue-50 rounded-full flex items-center">
                <Cloud size={10} className="mr-1" />
                cloud
              </span>
            )}
            <h3 className="text-sm font-medium text-gray-800 truncate">{save.name}</h3>
          </div>
          
          <div className="text-xs text-gray-500 mt-1">
            <span>{save.date}</span>
          </div>
        </div>
        
        {showSelection ? (
          <div 
            className="w-5 h-5 flex items-center justify-center cursor-pointer"
            onClick={handleSelectClick}
          >
            <div className={`
              w-4 h-4 rounded-full border 
              ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'} 
              flex items-center justify-center
            `}>
              {isSelected && <CheckCircle2 className="text-white" size={12} />}
            </div>
          </div>
        ) : (
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-green-600 hover:bg-green-50 h-7 w-7 p-0"
              onClick={() => onLoad()} 
            >
              <Play size={14} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
              onClick={() => onDelete()}
            >
              <Trash size={14} />
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
        <div className="flex items-center text-gray-600">
          <Calendar size={10} className="mr-1" />
          Day {save.data.day}
        </div>
        <div className="flex items-center text-gray-600">
          <Coins size={10} className="mr-1" />
          {save.data.coins} coins
        </div>
        <div className="flex items-center text-gray-600">
          <Smile size={10} className="mr-1" />
          City Stats
        </div>
      </div>
    </div>
  );
};

export default SaveItem; 