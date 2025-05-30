import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hammer, Shuffle, Brain, CheckCircle, Timer, Share2, Zap } from "lucide-react";
import type { Building } from "../../types/game";

type PuzzleType = 'memory' | 'sequence' | 'connect';

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
  
  const buildingRef = useRef(building);
  const selectedIndexRef = useRef(selectedIndex);
  const completeCallbackRef = useRef(onComplete);
  const closeCallbackRef = useRef(onClose);
  
  useEffect(() => {
    buildingRef.current = building;
    selectedIndexRef.current = selectedIndex;
    completeCallbackRef.current = onComplete;
    closeCallbackRef.current = onClose;
  }, [building, selectedIndex, onComplete, onClose]);

  const [puzzleType] = useState<PuzzleType>(() => {
    const allTypes: PuzzleType[] = ['memory', 'sequence', 'connect'];
    
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
  const [isProcessingMemoryClick, setIsProcessingMemoryClick] = useState(false);
  
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [sequenceClickCooldown, setSequenceClickCooldown] = useState(false);
  
  const [connectPoints, setConnectPoints] = useState<{x: number, y: number, number: number}[]>([]);
  const [connectLines, setConnectLines] = useState<{start: number, end: number}[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  const [completedConnections, setCompletedConnections] = useState<number>(0);
  const [requiredConnections, setRequiredConnections] = useState<number>(5);
  
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = puzzleType === 'memory' ? 999 : 3 + difficultyLevel;

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
    }
  }, [puzzleType, difficultyLevel]);
  
  const initializeConnectPuzzle = useCallback(() => {
    const numberOfPairs = 3 + difficultyLevel;
    const pointsArray: {x: number, y: number, number: number}[] = [];
    
    for (let i = 1; i <= numberOfPairs; i++) {
      for (let j = 0; j < 2; j++) {
        const x = Math.floor(Math.random() * 70) + 15;
        const y = Math.floor(Math.random() * 70) + 15;
        pointsArray.push({ x, y, number: i });
      }
    }
    
    const shuffled = pointsArray.sort(() => Math.random() - 0.5);
    
    setConnectPoints(shuffled);
    setRequiredConnections(numberOfPairs);
  }, [difficultyLevel]);
  
  const handleMemoryCardClick = useCallback((index: number) => {
    console.log('=== MEMORY CARD CLICK START ===');
    console.log('Clicked index:', index);
    console.log('Current flippedCards:', flippedCards);
    console.log('Current matchedCards:', matchedCards);
    console.log('Is processing click:', isProcessingMemoryClick);
    console.log('Card at index:', memoryCards[index]);
    
    if (flippedCards.includes(index)) {
      console.log('REJECTED: Card already flipped');
      return;
    }
    
    if (matchedCards.includes(index)) {
      console.log('REJECTED: Card already matched');
      return;
    }
    
    if (isProcessingMemoryClick) {
      console.log('REJECTED: Currently processing a click');
      return;
    }
    
    if (flippedCards.length >= 2) {
      console.log('REJECTED: Already have 2 cards flipped');
      return;
    }
    
    console.log('ACCEPTED: Processing card click');
    
    const newFlipped = [...flippedCards, index];
    console.log('New flipped cards:', newFlipped);
    setFlippedCards(newFlipped);
    
    if (newFlipped.length === 1) {
      console.log('First card flipped, ready for second card immediately');
    } else if (newFlipped.length === 2) {
      console.log('Second card flipped, checking for match - setting processing lock');
      setIsProcessingMemoryClick(true);
      
      const [first, second] = newFlipped;
      console.log('Comparing cards:', memoryCards[first], 'vs', memoryCards[second]);
      
      setTimeout(() => {
        if (memoryCards[first] === memoryCards[second]) {
          console.log('MATCH FOUND!');
          setMatchedCards(prev => {
            const newMatched = [...prev, first, second];
            console.log('New matched cards:', newMatched);
            
            if (newMatched.length === memoryCards.length) {
              console.log('GAME COMPLETE!');
              const completedPuzzleKey = `completed_puzzles_${buildingRef.current.id}`;
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
            return newMatched;
          });
        } else {
          console.log('NO MATCH - incrementing attempts');
          setAttempts(prev => {
            const newAttempts = prev + 1;
            console.log('New attempts:', newAttempts, 'Max attempts:', maxAttempts);
            if (newAttempts >= maxAttempts) {
              console.log('MAX ATTEMPTS REACHED - closing modal');
              closeCallbackRef.current();
            }
            return newAttempts;
          });
        }
        
        setTimeout(() => {
          console.log('Resetting flipped cards and processing state');
          setFlippedCards([]);
          setIsProcessingMemoryClick(false);
        }, 800);
      }, 600);
    }
    
    console.log('=== MEMORY CARD CLICK END ===');
  }, [flippedCards, matchedCards, memoryCards, puzzleType, maxAttempts]);
  
  const showSequence = useCallback(async () => {
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
  }, [sequence]);
  
  const handleSequenceClick = useCallback((index: number) => {
    if (showingSequence || sequenceClickCooldown) return;
    
    setSequenceClickCooldown(true);
    setTimeout(() => setSequenceClickCooldown(false), 200);
    
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
    
    setPlayerSequence(prev => {
      const newPlayerSequence = [...prev, index];
      
      if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
        setAttempts(prevAttempts => {
          const newAttempts = prevAttempts + 1;
          if (newAttempts >= maxAttempts) {
            closeCallbackRef.current();
          }
          return newAttempts;
        });
        return [];
      } else if (newPlayerSequence.length === sequence.length) {
        const completedPuzzleKey = `completed_puzzles_${buildingRef.current.id}`;
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
      
      return newPlayerSequence;
    });
  }, [showingSequence, sequenceClickCooldown, sequence, puzzleType, maxAttempts]);
  
  const handlePointClick = useCallback((index: number) => {
    if (selectedPoint === null) {
      setSelectedPoint(index);
    } else if (selectedPoint !== index) {
      const startPoint = connectPoints[selectedPoint];
      const endPoint = connectPoints[index];
      
      if (startPoint.number === endPoint.number) {
        const connectionExists = connectLines.some(line => 
          (line.start === selectedPoint && line.end === index) ||
          (line.start === index && line.end === selectedPoint)
        );
        
        if (!connectionExists) {
          setConnectLines(prev => [...prev, { start: selectedPoint, end: index }]);
          setCompletedConnections(prev => {
            const newCompletedConnections = prev + 1;
            
            if (newCompletedConnections >= requiredConnections) {
              const completedPuzzleKey = `completed_puzzles_${buildingRef.current.id}`;
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
            
            return newCompletedConnections;
          });
        }
      } else {
        setAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= maxAttempts) {
            closeCallbackRef.current();
          }
          return newAttempts;
        });
      }
      setSelectedPoint(null);
    } else {
      setSelectedPoint(null);
    }
  }, [selectedPoint, requiredConnections, puzzleType, connectPoints, connectLines, maxAttempts]);
  
  useEffect(() => {
    if (phase !== 'building') return;
    
    const intervalRef = { current: null as number | null };
    let isMounted = true;
    let hasCompleted = false;
    
    intervalRef.current = window.setInterval(() => {
      if (!isMounted) return;
      
      setBuildingProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          if (isMounted && !hasCompleted) {
            hasCompleted = true;
            setTimeout(() => {
              if (isMounted) {
                setPhase('complete');
                completeCallbackRef.current(buildingRef.current, selectedIndexRef.current);
              }
            }, 300);
          }
          
          return 100;
        }
        return newProgress;
      });
    }, 100);
    
    return () => {
      isMounted = false;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [phase]);
  
  useEffect(() => {
    if (phase !== 'complete') return;
    
    const closeTimerRef = { current: null as ReturnType<typeof setTimeout> | null };
    
    closeTimerRef.current = setTimeout(() => {
      if (closeCallbackRef.current) {
        closeCallbackRef.current();
      }
    }, 1500);
    
    return () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [phase]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={(e) => e.target === e.currentTarget && closeCallbackRef.current()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium lowercase">building {building.name}</h2>
          <button onClick={closeCallbackRef.current} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            
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
                <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
                  <div className="bg-emerald-50 p-2 rounded">
                    <span className="font-medium">cost:</span> {building.cost}c
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
                  match the construction tools (unlimited attempts) {isProcessingMemoryClick && "| processing..."}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {memoryCards.map((card, index) => (
                    <motion.div
                      key={index}
                      whileHover={!isProcessingMemoryClick ? { scale: 1.05 } : {}}
                      whileTap={!isProcessingMemoryClick ? { scale: 0.95 } : {}}
                      onClick={() => handleMemoryCardClick(index)}
                      className={`aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer transition-opacity ${
                        isProcessingMemoryClick ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
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
            
            {phase === 'puzzle' && puzzleType === 'connect' && (
              <motion.div
                key="connect"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">connect matching numbers</h3>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  connect pairs with the same numbers ({completedConnections}/{requiredConnections} pairs) | attempts: {attempts}/{maxAttempts}
                </p>
                <div 
                  className="relative bg-slate-100 rounded-lg h-80 mb-4"
                  style={{ touchAction: 'none' }}
                >
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {connectLines.map((line, i) => (
                      <line
                        key={i}
                        x1={`${connectPoints[line.start].x}%`}
                        y1={`${connectPoints[line.start].y}%`}
                        x2={`${connectPoints[line.end].x}%`}
                        y2={`${connectPoints[line.end].y}%`}
                        stroke="#10b981"
                        strokeWidth="3"
                      />
                    ))}
                    
                    {selectedPoint !== null && (
                      <line
                        x1={`${connectPoints[selectedPoint].x}%`}
                        y1={`${connectPoints[selectedPoint].y}%`}
                        x2="50%"
                        y2="50%"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        className="pointer-events-none"
                        style={{ 
                          opacity: 0.6,
                          transform: "translate(-50%, -50%)" 
                        }}
                      />
                    )}
                  </svg>
                  
                  {connectPoints.map((point, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => handlePointClick(i)}
                      className={`absolute w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer flex items-center justify-center text-white font-bold text-sm ${
                        selectedPoint === i ? 'bg-emerald-400 ring-4 ring-emerald-200' : 'bg-emerald-500 hover:bg-emerald-600'
                      }`}
                      style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                      }}
                    >
                      {point.number}
                    </motion.div>
                  ))}
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  Click on numbered points to connect matching pairs
                </p>
              </motion.div>
            )}
            
            {phase === 'building' && (
              <motion.div
                key="building"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <h3 className="text-lg font-medium text-gray-800 mb-4">construction in progress...</h3>
                
                <div className="relative h-6 bg-gray-200 rounded-full mb-6 overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-300"
                    style={{ width: `${buildingProgress}%` }}
                  />
                </div>
                
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-emerald-100">
                  <Hammer size={32} className="text-emerald-500" />
                </div>
                
                <p className="text-gray-600">Building {building.name}... {buildingProgress}%</p>
              </motion.div>
            )}
            
            {phase === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="text-center py-4"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-100">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                
                <h3 className="text-xl font-medium text-gray-800 mb-2">Building Complete!</h3>
                <p className="text-gray-600 mb-6">You've successfully built a {building.name}</p>
                
                <button
                  onClick={closeCallbackRef.current}
                  className="w-full py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                >
                  Close
                </button>
              </motion.div>
            )}
            
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}