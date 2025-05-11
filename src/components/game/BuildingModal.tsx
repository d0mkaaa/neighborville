import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hammer, Shuffle, Rotate3D, CheckCircle, Timer } from "lucide-react";
import type { Building } from "../../types/game";

type PuzzleType = 'memory' | 'sequence' | 'rotation';

type BuildingModalProps = {
  building: Building;
  onClose: () => void;
  onComplete: (building: Building, index: number) => void;
  selectedIndex: number;
  playerCoins: number;
};

export default function BuildingModal({ building, onClose, onComplete, selectedIndex, playerCoins }: BuildingModalProps) {
  console.log('BuildingModal rendered with:', { building, selectedIndex, playerCoins });
  
  const [phase, setPhase] = useState<'start' | 'puzzle' | 'building' | 'complete'>('start');
  const [puzzleType] = useState<PuzzleType>(() => {
    const types: PuzzleType[] = ['memory', 'sequence', 'rotation'];
    return types[Math.floor(Math.random() * types.length)];
  });
  
  const [memoryCards, setMemoryCards] = useState<string[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [buildingProgress, setBuildingProgress] = useState(0);
  
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  
  const [rotationTarget, setRotationTarget] = useState(0);
  const [currentRotation, setCurrentRotation] = useState(0);
  
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;
  
  useEffect(() => {
    if (puzzleType === 'memory') {
      const items = ['🔨', '🪚', '⚒️', '🔩', '🔧', '⚙️', '🛠️', '⚡'];
      const shuffled = [...items, ...items].sort(() => Math.random() - 0.5);
      setMemoryCards(shuffled);
    } else if (puzzleType === 'sequence') {
      const seq = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4));
      setSequence(seq);
    } else if (puzzleType === 'rotation') {
      const target = Math.floor(Math.random() * 8) * 45;
      setRotationTarget(target);
    }
  }, [puzzleType]);
  
  useEffect(() => {
    if (phase === 'building') {
      const timer = setInterval(() => {
        setBuildingProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setPhase('complete');
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      
      return () => clearInterval(timer);
    }
  }, [phase]);
  
  const handleMemoryCardClick = (index: number) => {
    if (flippedCards.includes(index) || matchedCards.includes(index)) return;
    
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);
    
    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (memoryCards[first] === memoryCards[second]) {
        setMatchedCards([...matchedCards, first, second]);
        if (matchedCards.length + 2 === memoryCards.length) {
          setTimeout(() => setPhase('building'), 500);
        }
      } else {
        setAttempts(prev => prev + 1);
        if (attempts + 1 >= maxAttempts) {
          onClose();
        }
      }
      setTimeout(() => setFlippedCards([]), 1000);
    }
  };
  
  const showSequence = async () => {
    setShowingSequence(true);
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const buttons = document.querySelectorAll('.sequence-button');
      buttons[sequence[i]]?.classList.add('highlighted');
      await new Promise(resolve => setTimeout(resolve, 400));
      buttons[sequence[i]]?.classList.remove('highlighted');
    }
    setShowingSequence(false);
  };
  
  const handleSequenceClick = (index: number) => {
    if (showingSequence) return;
    
    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);
    
    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      setAttempts(prev => prev + 1);
      setPlayerSequence([]);
      if (attempts + 1 >= maxAttempts) {
        onClose();
      }
    } else if (newPlayerSequence.length === sequence.length) {
      setTimeout(() => setPhase('building'), 500);
    }
  };
  
  const handleRotation = (direction: 'left' | 'right') => {
    const change = direction === 'left' ? -45 : 45;
    const newRotation = (currentRotation + change + 360) % 360;
    setCurrentRotation(newRotation);
    
    if (newRotation === rotationTarget) {
      setTimeout(() => setPhase('building'), 500);
    }
  };
  
  const handleComplete = () => {
    onComplete(building, selectedIndex);
    onClose();
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium lowercase">building {building.name}</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <AnimatePresence mode="wait">
            {phase === 'start' && (
              <motion.div
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                     style={{ backgroundColor: building.color + '20' }}>
                  <Hammer size={32} style={{ color: building.color }} />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">ready to build?</h3>
                <p className="text-gray-600 mb-4">complete a puzzle to start construction</p>
                <div className="grid grid-cols-3 gap-2 mb-6 text-sm">
                  <div className="bg-emerald-50 p-2 rounded">
                    <span className="font-medium">cost:</span> {building.cost}c
                  </div>
                  <div className="bg-emerald-50 p-2 rounded">
                    <span className="font-medium">happiness:</span> +{building.happiness}
                  </div>
                  <div className="bg-emerald-50 p-2 rounded">
                    <span className="font-medium">income:</span> {building.income}c/day
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPhase('puzzle')}
                  disabled={playerCoins < building.cost}
                  className={`w-full py-2 rounded-lg text-white font-medium ${
                    playerCoins < building.cost 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {playerCoins < building.cost ? 'insufficient funds' : 'start building'}
                </motion.button>
              </motion.div>
            )}
            
            {phase === 'puzzle' && puzzleType === 'memory' && (
              <motion.div
                key="memory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">memory game</h3>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  match the construction tools (attempts: {attempts}/{maxAttempts})
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {memoryCards.map((card, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMemoryCardClick(index)}
                      className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer"
                    >
                      {(flippedCards.includes(index) || matchedCards.includes(index)) ? (
                        <span className="text-2xl">{card}</span>
                      ) : (
                        <div className="w-full h-full bg-emerald-500 rounded-lg" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
            
            {phase === 'puzzle' && puzzleType === 'sequence' && (
              <motion.div
                key="sequence"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">sequence game</h3>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  repeat the sequence (attempts: {attempts}/{maxAttempts})
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSequenceClick(i)}
                      className="sequence-button aspect-square bg-gray-200 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'][i] }}
                    >
                      <span className="text-2xl">{['🔨', '🔧', '⚙️', '🛠️'][i]}</span>
                    </motion.button>
                  ))}
                </div>
                <button
                  onClick={showSequence}
                  disabled={showingSequence}
                  className="w-full py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-gray-300"
                >
                  {showingSequence ? 'watch carefully...' : 'show sequence'}
                </button>
              </motion.div>
            )}
            
            {phase === 'puzzle' && puzzleType === 'rotation' && (
              <motion.div
                key="rotation"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">rotation puzzle</h3>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  rotate to match the target position
                </p>
                <div className="flex justify-center items-center mb-6">
                  <div className="relative">
                    <motion.div
                      style={{ rotate: currentRotation }}
                      className="w-32 h-32 bg-emerald-100 rounded-lg flex items-center justify-center"
                    >
                      <Rotate3D size={48} className="text-emerald-600" />
                    </motion.div>
                    <div
                      className="absolute inset-0 border-4 border-dashed border-emerald-400 rounded-lg"
                      style={{ transform: `rotate(${rotationTarget}deg)` }}
                    />
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => handleRotation('left')}
                    className="p-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                  >
                    ← left
                  </button>
                  <button
                    onClick={() => handleRotation('right')}
                    className="p-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                  >
                    right →
                  </button>
                </div>
              </motion.div>
            )}
            
            {phase === 'building' && (
              <motion.div
                key="building"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Hammer size={48} className="text-emerald-600" />
                  </motion.div>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">building in progress...</h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <motion.div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${buildingProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">{buildingProgress}% complete</p>
              </motion.div>
            )}
            
            {phase === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={48} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">construction complete!</h3>
                <p className="text-gray-600 mb-6">{building.name} is now ready</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleComplete}
                  className="w-full py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-medium"
                >
                  place building
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}