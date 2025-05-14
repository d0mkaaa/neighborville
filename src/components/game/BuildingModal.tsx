import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hammer, Shuffle, Rotate3D, CheckCircle, Timer } from "lucide-react";
import type { Building } from "../../types/game";

type PuzzleType = 'memory' | 'sequence' | 'connect' | 'rotation';

type BuildingModalProps = {
  building: Building;
  onClose: () => void;
  onComplete: (building: Building, index: number) => void;
  onSaveGame?: () => Promise<void>;
  selectedIndex: number;
  playerCoins: number;
};

export default function BuildingModal({ building, onClose, onComplete, selectedIndex, playerCoins }: BuildingModalProps) {
  
  const [phase, setPhase] = useState<'start' | 'puzzle' | 'building' | 'complete'>('start');
  const [difficultyLevel, setDifficultyLevel] = useState<1|2|3>(1);
  const [puzzleType] = useState<PuzzleType>(() => {
    const allTypes: PuzzleType[] = ['memory', 'sequence', 'connect', 'rotation'];
    
    const completedPuzzleKey = `completed_puzzles_${building.id}`;
    const storedCompletedPuzzles = localStorage.getItem(completedPuzzleKey);
    
    let availableTypes = [...allTypes];
    
    if (storedCompletedPuzzles) {
      try {
        const completedTypes = JSON.parse(storedCompletedPuzzles) as PuzzleType[];
        availableTypes = allTypes.filter(type => !completedTypes.includes(type));
        
        if (availableTypes.length === 0) {
          localStorage.removeItem(completedPuzzleKey);
          availableTypes = [...allTypes];
        }
      } catch (e) {
        console.error('Error parsing completed puzzles:', e);
      }
    }
    
    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  });
  
  const [memoryCards, setMemoryCards] = useState<string[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [buildingProgress, setBuildingProgress] = useState(0);

  const [rotationPieces, setRotationPieces] = useState<{id: number, rotation: number, correctRotation: number, image: string}[]>([]);
  const [completedRotations, setCompletedRotations] = useState<number[]>([]);
  const [totalRotationPieces, setTotalRotationPieces] = useState<number>(4);
  
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  
  const [connectPoints, setConnectPoints] = useState<{x: number, y: number}[]>([]);
  const [connectLines, setConnectLines] = useState<{start: number, end: number}[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [completedConnections, setCompletedConnections] = useState<number>(0);
  const [requiredConnections, setRequiredConnections] = useState<number>(5);
  
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = puzzleType === 'memory' ? 999 : (puzzleType === 'rotation' ? 999 : 3 + difficultyLevel);
  
  useEffect(() => {
    if (puzzleType === 'memory') {
      const baseItems = ['🔨', '🪚', '🧹', '🔧'];
      const items = baseItems.slice(0, 2 + difficultyLevel);
      const shuffled = [...items, ...items].sort(() => Math.random() - 0.5);
      setMemoryCards(shuffled);
    } else if (puzzleType === 'sequence') {
      const seqLength = 3 + difficultyLevel;
      const seq = Array.from({ length: seqLength }, () => Math.floor(Math.random() * 4));
      setSequence(seq);
    } else if (puzzleType === 'connect') {
      initializeConnectPuzzle();
    } else if (puzzleType === 'rotation') {
      initializeRotationPuzzle();
    }
  }, [puzzleType, difficultyLevel]);
  
  const initializeConnectPuzzle = () => {
    const points = [];
    const gridSize = 8;
    const numPoints = 4 + difficultyLevel;
    
    for (let i = 0; i < numPoints; i++) {
      let x, y;
      let validPosition = false;
      
      while (!validPosition) {
        x = Math.floor(Math.random() * (gridSize - 2)) + 1;
        y = Math.floor(Math.random() * (gridSize - 2)) + 1;
        
        validPosition = true;
        
        for (const point of points) {
          const dist = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
          if (dist < 2) { 
            validPosition = false;
            break;
          }
        }
      }
      
      points.push({ x, y });
    }
    
    setConnectPoints(points);
    setRequiredConnections(numPoints - 1);
  };
  
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
  
  const initializeRotationPuzzle = () => {
    const images = ['🔨', '🧰', '🔧', '🪚', '🧹', '⚙️'];
    const pieces = [];
    
    const numPieces = 2 + difficultyLevel * 2;
    setTotalRotationPieces(numPieces);
    
    for (let i = 0; i < numPieces; i++) {
      const correctRotation = Math.floor(Math.random() * 4) * 90;
      pieces.push({
        id: i,
        rotation: Math.floor(Math.random() * 4) * 90,
        correctRotation,
        image: images[i % images.length]
      });
    }
    
    setRotationPieces(pieces);
    setCompletedRotations([]);
  };
  
  const handleRotationPiece = (index: number) => {
    const updatedPieces = [...rotationPieces];
    const piece = updatedPieces[index];
    
    piece.rotation = (piece.rotation + 90) % 360;
    
    if (piece.rotation === piece.correctRotation && !completedRotations.includes(index)) {
      const newCompleted = [...completedRotations, index];
      setCompletedRotations(newCompleted);
      
      if (newCompleted.length === totalRotationPieces) {
        const completedPuzzleKey = `completed_puzzles_${building.id}`;
        const storedPuzzles = localStorage.getItem(completedPuzzleKey);
        let completedPuzzles: PuzzleType[] = [];
        
        try {
          completedPuzzles = storedPuzzles ? JSON.parse(storedPuzzles) : [];
        } catch (e) {
          console.error('Error parsing completed puzzles:', e);
        }
        
        if (!completedPuzzles.includes(puzzleType)) {
          completedPuzzles.push(puzzleType);
          localStorage.setItem(completedPuzzleKey, JSON.stringify(completedPuzzles));
        }
        
        setTimeout(() => setPhase('building'), 500);
      }
    }
    
    setRotationPieces(updatedPieces);
  };
  
  const handleMemoryCardClick = (index: number) => {
    if (flippedCards.includes(index) || matchedCards.includes(index)) return;
    
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);
    
    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (memoryCards[first] === memoryCards[second]) {
        setMatchedCards([...matchedCards, first, second]);
        if (matchedCards.length + 2 === memoryCards.length) {
          const completedPuzzleKey = `completed_puzzles_${building.id}`;
          const storedPuzzles = localStorage.getItem(completedPuzzleKey);
          let completedPuzzles: PuzzleType[] = [];
          
          try {
            completedPuzzles = storedPuzzles ? JSON.parse(storedPuzzles) : [];
          } catch (e) {
            console.error('Error parsing completed puzzles:', e);
          }
          
          if (!completedPuzzles.includes(puzzleType)) {
            completedPuzzles.push(puzzleType);
            localStorage.setItem(completedPuzzleKey, JSON.stringify(completedPuzzles));
          }
          
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
      const button = buttons[sequence[i]] as HTMLElement | undefined;
      
      if (button) {
        const overlay = button.querySelector('.highlighted-overlay') as HTMLElement | null;
        
        if (overlay) {
          overlay.classList.add('opacity-50');
          button.classList.add('scale-110');
          button.style.boxShadow = '0 0 15px 5px rgba(255,255,255,0.7)';
        }
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        if (overlay) {
          overlay.classList.remove('opacity-50');
          button.classList.remove('scale-110');
          button.style.boxShadow = '0 0 0 0 rgba(255,255,255,0)';
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }
    setShowingSequence(false);
  };
  
  const handleSequenceClick = (index: number) => {
    if (showingSequence) return;
    
    const button = document.querySelectorAll('.sequence-button')[index] as HTMLElement | undefined;
    if (button) {
      const overlay = button.querySelector('.highlighted-overlay') as HTMLElement | null;
      if (overlay) {
        overlay.classList.add('opacity-50');
        button.classList.add('scale-75');
        button.style.boxShadow = '0 0 10px 3px rgba(255,255,255,0.7)';
        
        setTimeout(() => {
          overlay.classList.remove('opacity-50');
          button.classList.remove('scale-75');
          button.style.boxShadow = '0 0 0 0 rgba(255,255,255,0)';
        }, 200);
      }
    }
    
    const newPlayerSequence = [...playerSequence, index];
    setPlayerSequence(newPlayerSequence);
    
    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      setAttempts(prev => prev + 1);
      setPlayerSequence([]);
      if (attempts + 1 >= maxAttempts) {
        onClose();
      }
    } else if (newPlayerSequence.length === sequence.length) {
      const completedPuzzleKey = `completed_puzzles_${building.id}`;
      const storedPuzzles = localStorage.getItem(completedPuzzleKey);
      let completedPuzzles: PuzzleType[] = [];
      
      try {
        completedPuzzles = storedPuzzles ? JSON.parse(storedPuzzles) : [];
      } catch (e) {
        console.error('Error parsing completed puzzles:', e);
      }
      
      if (!completedPuzzles.includes(puzzleType)) {
        completedPuzzles.push(puzzleType);
        localStorage.setItem(completedPuzzleKey, JSON.stringify(completedPuzzles));
      }
      
      setTimeout(() => setPhase('building'), 500);
    }
  };
  
  const handleConnectPoint = (index: number) => {
    if (selectedPoint === null) {
      setSelectedPoint(index);
    } else if (selectedPoint === index) {
      setSelectedPoint(null);
    } else {
      const alreadyConnected = connectLines.some(
        line => (line.start === selectedPoint && line.end === index) || 
                (line.start === index && line.end === selectedPoint)
      );
      
      if (!alreadyConnected) {
        setConnectLines([...connectLines, { start: selectedPoint, end: index }]);
        setCompletedConnections(prev => prev + 1);
        
        if (completedConnections + 1 >= requiredConnections) {
          const completedPuzzleKey = `completed_puzzles_${building.id}`;
          const storedPuzzles = localStorage.getItem(completedPuzzleKey);
          let completedPuzzles: PuzzleType[] = [];
          
          try {
            completedPuzzles = storedPuzzles ? JSON.parse(storedPuzzles) : [];
          } catch (e) {
            console.error('Error parsing completed puzzles:', e);
          }
          
          if (!completedPuzzles.includes(puzzleType)) {
            completedPuzzles.push(puzzleType);
            localStorage.setItem(completedPuzzleKey, JSON.stringify(completedPuzzles));
          }
          
          setTimeout(() => setPhase('building'), 500);
        }
      }
      
      setSelectedPoint(null);
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
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Select difficulty:</p>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3].map((level) => (
                      <button
                        key={level}
                        onClick={() => setDifficultyLevel(level as 1|2|3)}
                        className={`flex-1 py-1 rounded ${difficultyLevel === level 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {level === 1 ? 'Easy' : level === 2 ? 'Medium' : 'Hard'}
                      </button>
                    ))}
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
                  match the construction tools {puzzleType === 'memory' ? '(unlimited attempts)' : `(attempts: ${attempts}/${maxAttempts})`}
                </p>
                <div className="grid grid-cols-2 gap-2">
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
                      className="sequence-button aspect-square rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-200"
                      style={{
                        backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'][i],
                        boxShadow: '0 0 0 0 rgba(255,255,255,0)'
                      }}
                    >
                      <span className="text-2xl z-10 relative">{['🔨', '🔧', '⚙️', '🛠️'][i]}</span>
                      <div className="absolute inset-0 opacity-0 bg-white transition-opacity duration-200 highlighted-overlay"></div>
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
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">blueprint alignment</h3>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  rotate the pieces to match the blueprint ({completedRotations.length}/{totalRotationPieces} pieces)
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {rotationPieces.map((piece, index) => (
                    <motion.div
                      key={index}
                      onClick={() => handleRotationPiece(index)}
                      style={{
                        transform: `rotate(${piece.rotation}deg)`,
                        backgroundColor: completedRotations.includes(index) ? '#d1fae5' : '#f3f4f6',
                        borderColor: completedRotations.includes(index) ? '#10b981' : '#e5e7eb'
                      }}
                      className="aspect-square rounded-lg flex items-center justify-center cursor-pointer border-2 transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-2xl">{piece.image}</span>
                      {completedRotations.includes(index) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-lg"></div>
                          <CheckCircle className="text-emerald-500 opacity-80" size={20} />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="text-center text-sm text-gray-600 mb-4">
                  <p>Click on a piece to rotate it clockwise</p>
                  <p>Difficulty: {difficultyLevel === 1 ? 'Easy' : difficultyLevel === 2 ? 'Medium' : 'Hard'}</p>
                </div>
              </motion.div>
            )}
            
            {phase === 'puzzle' && puzzleType === 'connect' && (
              <motion.div
                key="connect"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">building blueprint</h3>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  connect the points to complete the blueprint ({completedConnections}/{requiredConnections} lines)
                </p>
                <div className="flex justify-center items-center mb-6">
                  <div 
                    className="w-64 h-64 bg-blue-50 rounded-lg relative"
                    style={{ backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                             backgroundSize: '32px 32px' }}
                  >
                    <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                      {connectLines.map((line, idx) => {
                        const start = connectPoints[line.start];
                        const end = connectPoints[line.end];
                        
                        return (
                          <line 
                            key={idx}
                            x1={start.x * 32} 
                            y1={start.y * 32} 
                            x2={end.x * 32} 
                            y2={end.y * 32}
                            stroke="#3b82f6" 
                            strokeWidth="3"
                          />
                        );
                      })}
                      
                      {selectedPoint !== null && (
                        <line 
                          x1={connectPoints[selectedPoint].x * 32} 
                          y1={connectPoints[selectedPoint].y * 32} 
                          x2={(connectPoints[selectedPoint].x * 32) + Math.random() * 0.001}
                          y2={(connectPoints[selectedPoint].y * 32) + Math.random() * 0.001}
                          stroke="#3b82f6" 
                          strokeWidth="3"
                          strokeDasharray="4"
                          className="animate-pulse"
                        />
                      )}
                    </svg>
                    
                    {connectPoints.map((point, idx) => (
                      <motion.div
                        key={idx}
                        className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center cursor-pointer ${
                          selectedPoint === idx ? 'bg-emerald-500' : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        style={{ left: point.x * 32, top: point.y * 32 }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleConnectPoint(idx)}
                      >
                        <span className="text-white text-xs font-bold">{idx + 1}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setConnectLines([]);
                      setSelectedPoint(null);
                      setCompletedConnections(0);
                    }}
                    className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"
                  >
                    Reset Connections
                  </motion.button>
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