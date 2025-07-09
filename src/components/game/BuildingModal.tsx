import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hammer, Shuffle, Brain, CheckCircle, Timer, Share2, Zap, Package, AlertTriangle, Sparkles, Star, Target, Clock } from "lucide-react";
import type { Building } from "../../types/game";
import { getResourceById, getRecipesByBuilding } from "../../data/resources";

type PuzzleType = 'memory' | 'sequence' | 'connect' | 'circuit' | 'pattern' | 'reaction';

type BuildingModalProps = {
  building: Building;
  onClose: () => void;
  onComplete: (building: Building, index: number) => void;
  onSaveGame?: () => Promise<void>;
  selectedIndex: number;
  playerCoins: number;
  playerResources?: { [resourceId: string]: number };
  onResourceUpdate?: (resources: { [resourceId: string]: number }) => void;
};

export default function BuildingModal({ building, onClose, onComplete, selectedIndex, playerCoins, playerResources, onResourceUpdate }: BuildingModalProps) {
  
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
    const allTypes: PuzzleType[] = ['memory', 'sequence', 'connect', 'circuit', 'pattern', 'reaction'];
    
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
  
  const [circuitGrid, setCircuitGrid] = useState<{
    type: 'empty' | 'power' | 'target' | 'wire' | 'component';
    component?: 'resistor' | 'capacitor' | 'led' | 'switch';
    powered?: boolean;
    connected?: boolean;
    id: number;
  }[]>([]);
  const [circuitSize, setCircuitSize] = useState<number>(5);
  const [selectedCircuitTile, setSelectedCircuitTile] = useState<number | null>(null);
  const [circuitComponents, setCircuitComponents] = useState<{type: string, count: number}[]>([]);
  const [selectedComponentType, setSelectedComponentType] = useState<string | null>(null);
  const [circuitPhase, setCircuitPhase] = useState<'planning' | 'building'>('planning');
  const [circuitPowered, setCircuitPowered] = useState<boolean>(false);
  const [patternSequence, setPatternSequence] = useState<string[]>([]);
  const [playerPattern, setPlayerPattern] = useState<string[]>([]);
  const [patternShowTime, setPatternShowTime] = useState<number>(0);
  const [reactionTargets, setReactionTargets] = useState<{id: number, x: number, y: number, active: boolean}[]>([]);
  const [reactionScore, setReactionScore] = useState<number>(0);
  const [reactionTimeLeft, setReactionTimeLeft] = useState<number>(0);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [perfectScore, setPerfectScore] = useState<boolean>(false);
  const [reactionGameActive, setReactionGameActive] = useState<boolean>(false);
  const [totalTargetsSpawned, setTotalTargetsSpawned] = useState<number>(0);
  const [hitEffects, setHitEffects] = useState<{id: number, x: number, y: number}[]>([]);
  
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = puzzleType === 'memory' ? 999 : puzzleType === 'reaction' ? 1 : 3 + difficultyLevel;

  const getResourceCosts = useCallback(() => {
    if (building.productionType && building.id) {
      const recipes = getRecipesByBuilding(building.id);
      if (recipes.length > 0) {
        return recipes[0].inputs;
      }
    }
    
    const cost = building.cost || 0;
    const basicCosts = [];
    
    if (cost > 100) {
      basicCosts.push({ resourceId: 'wood', quantity: Math.max(1, Math.floor(cost / 150)) });
    }
    if (cost > 200) {
      basicCosts.push({ resourceId: 'stone', quantity: Math.max(1, Math.floor(cost / 300)) });
    }
    
    if (cost > 800) {
      basicCosts.push({ resourceId: 'iron_ore', quantity: Math.max(1, Math.floor(cost / 1000)) });
    }
    
    return basicCosts;
  }, [building]);

  const resourceCosts = getResourceCosts();
  
  const canAffordBuilding = useCallback(() => {
    const hasCoins = playerCoins >= (building.cost || 0);
    
    if (!playerResources || resourceCosts.length === 0) {
      return hasCoins;
    }
    
    const hasResources = resourceCosts.every(cost => 
      (playerResources[cost.resourceId] || 0) >= cost.quantity
    );
    
    return hasCoins && hasResources;
  }, [playerCoins, building.cost, playerResources, resourceCosts]);
  
  const getRemainingResources = useCallback(() => {
    if (!playerResources) return {};
    
    const remaining = { ...playerResources };
    resourceCosts.forEach(cost => {
      remaining[cost.resourceId] = (remaining[cost.resourceId] || 0) - cost.quantity;
    });
    
    return remaining;
  }, [playerResources, resourceCosts]);

  useEffect(() => {
    if (puzzleType === 'memory') {
      const baseItems = ['🔨', '🪚', '🧹', '🔧', '⚙️', '🗜️', '📏', '✂️'];
      const items = baseItems.slice(0, 2 + difficultyLevel);
      const shuffled = [...items, ...items].sort(() => Math.random() - 0.5);
      setMemoryCards(shuffled);
    } else if (puzzleType === 'sequence') {
      const seqLength = 3 + difficultyLevel;
      const seq = Array.from({ length: seqLength }, () => Math.floor(Math.random() * 4));
      setSequence(seq);
    } else if (puzzleType === 'connect') {
      initializeConnectPuzzle();
    } else if (puzzleType === 'circuit') {
      initializeCircuitPuzzle();
    } else if (puzzleType === 'pattern') {
      initializePatternPuzzle();
    } else if (puzzleType === 'reaction') {
      initializeReactionPuzzle();
    }
  }, [puzzleType, difficultyLevel]);
  
  const initializeConnectPuzzle = useCallback(() => {
    const numberOfPairs = 3 + difficultyLevel;
    const pointsArray: {x: number, y: number, number: number}[] = [];
    
    const gridCells = 8;
    const cellSize = 80 / gridCells;
    const minDistance = 15;
    
    const usedPositions: {x: number, y: number}[] = [];
    
    const isPositionValid = (x: number, y: number) => {
      return usedPositions.every(pos => {
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        return distance >= minDistance;
      });
    };
    
    const generateValidPosition = () => {
      let attempts = 0;
      let x, y;
      
      do {
        if (attempts < 20) {
          const gridX = Math.floor(Math.random() * gridCells);
          const gridY = Math.floor(Math.random() * gridCells);
          x = 15 + (gridX * cellSize) + (Math.random() * cellSize * 0.6);
          y = 15 + (gridY * cellSize) + (Math.random() * cellSize * 0.6);
        } else {
          x = Math.floor(Math.random() * 70) + 15;
          y = Math.floor(Math.random() * 70) + 15;
        }
        attempts++;
      } while (!isPositionValid(x, y) && attempts < 50);
      
      return { x, y };
    };
    
    for (let i = 1; i <= numberOfPairs; i++) {
      for (let j = 0; j < 2; j++) {
        const position = generateValidPosition();
        pointsArray.push({ x: position.x, y: position.y, number: i });
        usedPositions.push(position);
      }
    }
    
    const shuffled = pointsArray.sort(() => Math.random() - 0.5);
    
    setConnectPoints(shuffled);
    setRequiredConnections(numberOfPairs);
  }, [difficultyLevel]);

  const initializeCircuitPuzzle = useCallback(() => {
    const size = 5 + difficultyLevel;
    setCircuitSize(size);
    setSelectedCircuitTile(null);
    setSelectedComponentType(null);
    setCircuitPhase('planning');
    setCircuitPowered(false);
    
    const grid: {
      type: 'empty' | 'power' | 'target' | 'wire' | 'component';
      component?: 'resistor' | 'capacitor' | 'led' | 'switch';
      powered?: boolean;
      connected?: boolean;
      id: number;
    }[] = Array.from({ length: size * size }, (_, i) => ({
      type: 'empty',
      powered: false,
      connected: false,
      id: i
    }));
    
    grid[0] = {
      type: 'power' as const,
      powered: true,
      connected: true,
      id: 0
    };
    
    const targetIndex = size * size - 1;
    grid[targetIndex] = {
      type: 'target' as const,
      powered: false,
      connected: false,
      id: targetIndex
    };
    
    const availableComponents = [];
    
    availableComponents.push({ type: 'resistor', count: 2 + difficultyLevel });
    availableComponents.push({ type: 'capacitor', count: 1 + difficultyLevel });
    
    if (difficultyLevel >= 2) {
      availableComponents.push({ type: 'led', count: 1 });
    }
    if (difficultyLevel >= 3) {
      availableComponents.push({ type: 'switch', count: 1 });
    }
    
    setCircuitComponents(availableComponents);
    setCircuitGrid(grid);
  }, [difficultyLevel]);

  const initializePatternPuzzle = useCallback(() => {
    const colors = ['🔴', '🟢', '🔵', '🟡', '🟠', '🟣'];
    const patternLength = 4 + difficultyLevel;
    const pattern = Array.from({ length: patternLength }, () => 
      colors[Math.floor(Math.random() * Math.min(4 + difficultyLevel, colors.length))]
    );
    setPatternSequence(pattern);
    setPlayerPattern([]);
    setPatternShowTime(2000 + difficultyLevel * 500);
    
    setTimeout(() => {
      setPatternShowTime(0);
    }, 2000 + difficultyLevel * 500);
  }, [difficultyLevel]);

  const initializeReactionPuzzle = useCallback(() => {
    console.log('🎯 Initializing reaction puzzle...');
    
    setReactionTargets([]);
    setHitEffects([]);
    setReactionScore(0);
    setTotalTargetsSpawned(0);
    setPerfectScore(false);
    
    const gameDuration = 10 + difficultyLevel * 5;
    setReactionTimeLeft(gameDuration);
    setGameStartTime(Date.now());
    
    setTimeout(() => {
      console.log('🎯 Starting reaction game!');
      setReactionGameActive(true);
      
      let spawnInterval: number;
      let gameTimer: number;
      let countdownTimer: number;
      
      const spawnTarget = () => {
        setReactionGameActive(current => {
          if (!current) return current;
          
          const id = Math.random();
          setReactionTargets(prev => [...prev, {
            id,
            x: Math.random() * 80 + 10,
            y: Math.random() * 80 + 10,
            active: true
          }]);
          
          setTotalTargetsSpawned(prev => {
            const newCount = prev + 1;
            console.log(`🎯 Target spawned! Total: ${newCount}`);
            return newCount;
          });
          
          setTimeout(() => {
            setReactionTargets(prev => prev.filter(t => t.id !== id));
          }, 2000 + Math.random() * 1000);
          
          return current;
        });
      };
      
      spawnTarget();
      spawnInterval = window.setInterval(spawnTarget, 800 - difficultyLevel * 100);
      
      countdownTimer = window.setInterval(() => {
        setReactionTimeLeft(prev => {
          if (prev <= 1) {
            console.log('🎯 Time up! Ending game...');
            setReactionGameActive(false);
            clearInterval(spawnInterval);
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      gameTimer = window.setTimeout(() => {
        console.log('🎯 Game duration reached! Ending game...');
        setReactionGameActive(false);
        clearInterval(spawnInterval);
        clearInterval(countdownTimer);
        setReactionTimeLeft(0);
      }, gameDuration * 1000);
      
      const cleanup = () => {
        console.log('🎯 Cleaning up reaction game...');
        setReactionGameActive(false);
        clearInterval(spawnInterval);
        clearInterval(countdownTimer);
        clearTimeout(gameTimer);
      };
      
      (window as any).reactionGameCleanup = cleanup;
      
    }, 100);
    
  }, [difficultyLevel]);
  
  const handleMemoryCardClick = useCallback((index: number) => {
    
    
    if (flippedCards.includes(index)) {
      return;
    }
    
    if (matchedCards.includes(index)) {
      return;
    }
    
    if (isProcessingMemoryClick) {
      return;
    }
    
    if (flippedCards.length >= 2) {
      return;
    }
    
    
    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);
    
    if (newFlipped.length === 1) {
    } else if (newFlipped.length === 2) {
      setIsProcessingMemoryClick(true);
      
      const [first, second] = newFlipped;
      
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
              
              setTimeout(() => setPhase('complete'), 500);
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
        
        setTimeout(() => setPhase('complete'), 500);
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
              
              setTimeout(() => setPhase('complete'), 500);
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

  const handleCircuitTileClick = useCallback((index: number) => {
    const currentTile = circuitGrid[index];
    
    if (currentTile.type === 'power' || currentTile.type === 'target') {
      return;
    }
    
    const newGrid = [...circuitGrid];
    
    if (currentTile.type === 'empty') {
      if (selectedComponentType) {
        const canPlace = validateComponentPlacement(selectedComponentType, index, circuitGrid);
        
        if (!canPlace) {
          return;
        }
        
        const componentIndex = circuitComponents.findIndex(c => c.type === selectedComponentType);
        if (componentIndex === -1 || circuitComponents[componentIndex].count === 0) {
          return;
        }
        
        newGrid[index] = {
          ...currentTile,
          type: 'component',
          component: selectedComponentType as 'resistor' | 'capacitor' | 'led' | 'switch'
        };
        
        const newComponents = [...circuitComponents];
        newComponents[componentIndex].count--;
        setCircuitComponents(newComponents);
        
      } else {
        newGrid[index] = {
          ...currentTile,
          type: 'wire'
        };
      }
    } else if (currentTile.type === 'wire' || currentTile.type === 'component') {
      if (currentTile.type === 'component' && currentTile.component) {
        const newComponents = [...circuitComponents];
        const existingComponent = newComponents.find(c => c.type === currentTile.component);
        if (existingComponent) {
          existingComponent.count++;
        } else {
          newComponents.push({ type: currentTile.component, count: 1 });
        }
        setCircuitComponents(newComponents);
      }
      
      newGrid[index] = {
        ...currentTile,
        type: 'empty',
        component: undefined
      };
    }
    
    setCircuitGrid(newGrid);
    
    checkCircuitComplete(newGrid);
  }, [circuitGrid, circuitComponents, selectedComponentType]);

  const validateComponentPlacement = useCallback((componentType: string, index: number, grid: typeof circuitGrid) => {
    
    const row = Math.floor(index / circuitSize);
    const col = index % circuitSize;
    
    const distanceFromPower = row + col;
    
    const existingComponents = grid.filter(tile => tile.type === 'component').map(tile => tile.component);
    
    switch (componentType) {
      case 'resistor':
        return true;
        
      case 'capacitor':
        const hasResistor = existingComponents.includes('resistor');
        if (!hasResistor && distanceFromPower < 2) {
          return false;
        }
        return true;
        
      case 'led':
        return existingComponents.includes('resistor');
        
      case 'switch':
        return distanceFromPower <= circuitSize;
        
      default:
        return true;
    }
  }, [circuitSize]);

  const checkCircuitComplete = useCallback((grid: typeof circuitGrid) => {
    const size = circuitSize;
    const visited = new Set<number>();
    const queue = [0];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      
      const currentTile = grid[current];
      if (currentTile.type === 'target') {
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
        
        setTimeout(() => setPhase('complete'), 500);
        return;
      }
      
      if (currentTile.type === 'wire' || currentTile.type === 'component' || currentTile.type === 'power') {
        const row = Math.floor(current / size);
        const col = current % size;
        
        const neighbors = [
          row > 0 ? current - size : -1,
          row < size - 1 ? current + size : -1,
          col > 0 ? current - 1 : -1,
          col < size - 1 ? current + 1 : -1
        ].filter(n => n >= 0 && n < grid.length);
        
        for (const neighbor of neighbors) {
          const neighborTile = grid[neighbor];
          if ((neighborTile.type === 'wire' || neighborTile.type === 'component' || neighborTile.type === 'target') && !visited.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }
  }, [circuitSize, puzzleType]);

  const handlePatternColorClick = useCallback((color: string) => {
    const newPlayerPattern = [...playerPattern, color];
    setPlayerPattern(newPlayerPattern);
    
    if (newPlayerPattern[newPlayerPattern.length - 1] !== patternSequence[newPlayerPattern.length - 1]) {
      setAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= maxAttempts) {
          closeCallbackRef.current();
        }
        return newAttempts;
      });
      setPlayerPattern([]);
    } else if (newPlayerPattern.length === patternSequence.length) {
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
      
      setTimeout(() => setPhase('complete'), 500);
    }
  }, [playerPattern, patternSequence, puzzleType, maxAttempts]);

  const handleReactionTargetClick = useCallback((targetId: number, x: number, y: number) => {
    if (!reactionGameActive) return;
    
    const effectId = Date.now() + Math.random();
    setHitEffects(prev => [...prev, { id: effectId, x, y }]);
    
    setTimeout(() => {
      setHitEffects(prev => prev.filter(effect => effect.id !== effectId));
    }, 1000);
    
    setReactionTargets(prev => prev.filter(t => t.id !== targetId));
    setReactionScore(prev => prev + 1);
  }, [reactionGameActive]);

  useEffect(() => {
    if (puzzleType !== 'reaction' || reactionGameActive || reactionTimeLeft > 0 || totalTargetsSpawned === 0) {
      return;
    }
    
    console.log(`Reaction game ended: ${reactionScore} hits out of ${totalTargetsSpawned} targets spawned`);
    
    const minTargetsNeeded = Math.max(5, Math.ceil(totalTargetsSpawned * 0.6));
    const perfectTargetsNeeded = Math.ceil(totalTargetsSpawned * 0.8);
    
    console.log(`Need ${minTargetsNeeded} for completion, ${perfectTargetsNeeded} for perfect`);
    
    if (reactionScore >= perfectTargetsNeeded) {
      console.log('Perfect score achieved!');
      setPerfectScore(true);
      
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
      
      setTimeout(() => setPhase('complete'), 1500);
    } else if (reactionScore >= minTargetsNeeded) {
      console.log('Good score - game completed!');
      
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
      
      setTimeout(() => setPhase('complete'), 1500);
    } else {
      console.log('Score too low - trying again');
      setAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= maxAttempts) {
          console.log('Max attempts reached - closing modal');
          closeCallbackRef.current();
        } else {
          setTimeout(() => {
            setReactionTargets([]);
            initializeReactionPuzzle();
          }, 2000);
        }
        return newAttempts;
      });
    }
  }, [reactionGameActive, reactionTimeLeft, reactionScore, totalTargetsSpawned, puzzleType, maxAttempts, initializeReactionPuzzle]);
  
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
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden border border-gray-100"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(100,116,139,0.05) 1px, transparent 0)',
          backgroundSize: '20px 20px'
        }}
      >
        <div className="p-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Hammer size={20} className="text-white" />
            </motion.div>
            <h2 className="text-lg font-bold">Building {building.name}</h2>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={closeCallbackRef.current} 
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-full"
          >
            <X size={20} />
          </motion.button>
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
                <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg">
                  <Hammer size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Ready to Build!</h3>
                <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {puzzleType === 'memory' && <><Brain size={18} className="text-green-500" /> <span className="font-medium text-green-700">Memory Game</span></>}
                    {puzzleType === 'sequence' && <><Zap size={18} className="text-blue-500" /> <span className="font-medium text-blue-700">Sequence Game</span></>}
                    {puzzleType === 'connect' && <><Share2 size={18} className="text-purple-500" /> <span className="font-medium text-purple-700">Connect Game</span></>}
                    {puzzleType === 'circuit' && <><Zap size={18} className="text-amber-500" /> <span className="font-medium text-amber-700">Circuit Builder</span></>}
                    {puzzleType === 'pattern' && <><Brain size={18} className="text-purple-500" /> <span className="font-medium text-purple-700">Pattern Memory</span></>}
                    {puzzleType === 'reaction' && <><Target size={18} className="text-red-500" /> <span className="font-medium text-red-700">Reaction Challenge</span></>}
                  </div>
                  <p className="text-xs text-center text-gray-600">
                    {puzzleType === 'memory' && 'Match construction tools to unlock building'}
                    {puzzleType === 'sequence' && 'Repeat the sequence shown to you'}
                    {puzzleType === 'connect' && 'Connect matching numbered points'}
                    {puzzleType === 'circuit' && 'Connect components to power the circuit'}
                    {puzzleType === 'pattern' && 'Memorize and repeat the color pattern'}
                    {puzzleType === 'reaction' && 'Click targets as fast as possible!'}
                  </p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className={`p-3 rounded-lg border ${
                    playerCoins >= (building.cost || 0) 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Coin Cost:</span>
                      <span className={`font-bold ${
                        playerCoins >= (building.cost || 0) ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {building.cost}c
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      You have: {playerCoins}c → {playerCoins - (building.cost || 0)}c
                    </div>
                  </div>
                  
                  {resourceCosts.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
                        <Package size={14} />
                        Resource Requirements:
                      </h4>
                      <div className="space-y-2">
                        {resourceCosts.map((cost, index) => {
                          const resource = getResourceById(cost.resourceId);
                          const playerHas = playerResources?.[cost.resourceId] || 0;
                          const hasEnough = playerHas >= cost.quantity;
                          const remaining = playerHas - cost.quantity;
                          
                          return (
                            <div key={index} className={`flex items-center justify-between p-2 rounded ${
                              hasEnough ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{resource?.icon}</span>
                                <span className="text-sm font-medium">{resource?.name}</span>
                              </div>
                              <div className="text-right">
                                <div className={`text-sm font-bold ${
                                  hasEnough ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  -{cost.quantity}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {playerHas} → {remaining}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-emerald-800">Daily Income:</span>
                      <span className="text-sm font-bold text-emerald-600">+{building.income}c/day</span>
                    </div>
                    {building.productionType && (
                      <div className="text-xs text-emerald-600 mt-1">
                        Production building - generates resources
                      </div>
                    )}
                  </div>
                </div>
                
                {!canAffordBuilding() && (
                  <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle size={16} />
                      <span className="text-sm font-medium">Cannot afford this building</span>
                    </div>
                    <div className="text-xs text-red-600 mt-1">
                      {playerCoins < (building.cost || 0) && "Insufficient coins. "}
                      {resourceCosts.some(cost => (playerResources?.[cost.resourceId] || 0) < cost.quantity) && "Missing required resources."}
                    </div>
                  </div>
                )}
                
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
                  disabled={!canAffordBuilding()}
                  className={`w-full py-2 rounded-lg text-white font-medium ${
                    !canAffordBuilding() ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {canAffordBuilding() ? 'start building' : 'insufficient funds'}
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

            {phase === 'puzzle' && puzzleType === 'circuit' && (
              <motion.div
                key="circuit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                  <Zap size={20} className="text-amber-500" />
                  Strategic Circuit Builder
                </h3>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Plan your circuit strategically! (attempts: {attempts}/{maxAttempts})
                </p>
                
                <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-700 mb-2 font-medium">Select Component to Place:</p>
                  <div className="flex gap-2 flex-wrap mb-2">
                    <button
                      onClick={() => setSelectedComponentType(null)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                        selectedComponentType === null 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      Wire (─)
                    </button>
                    {circuitComponents.map((comp, idx) => (
                      <button
                        key={idx}
                        disabled={comp.count === 0}
                        onClick={() => setSelectedComponentType(comp.type)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 ${
                          selectedComponentType === comp.type 
                            ? 'bg-amber-500 text-white' 
                            : comp.count > 0
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span className="font-mono">
                          {comp.type === 'resistor' ? 'R' :
                           comp.type === 'capacitor' ? 'C' :
                           comp.type === 'led' ? 'L' : 'S'}
                        </span>
                        <span>{comp.type}</span>
                        <span className="text-xs">×{comp.count}</span>
                      </button>
                    ))}
                  </div>
                  {selectedComponentType && (
                    <div className="text-xs text-amber-600 bg-amber-100 rounded px-2 py-1">
                      <strong>Tip:</strong> {
                        selectedComponentType === 'resistor' ? 'Place near power source to control current flow' :
                        selectedComponentType === 'capacitor' ? 'Best placed after resistors for energy storage' :
                        selectedComponentType === 'led' ? 'Requires resistor in circuit for protection' :
                        'Effective for controlling circuit activation'
                      }
                    </div>
                  )}
                </div>
                
                <div 
                  className="grid gap-1 mb-4 mx-auto bg-slate-900 p-3 rounded-lg"
                  style={{ 
                    gridTemplateColumns: `repeat(${circuitSize}, 1fr)`,
                    width: 'fit-content'
                  }}
                >
                  {circuitGrid.map((tile, index) => {
                    const canPlace = selectedComponentType ? 
                      validateComponentPlacement(selectedComponentType, index, circuitGrid) : 
                      true;
                    
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: canPlace ? 1.05 : 1 }}
                        whileTap={{ scale: canPlace ? 0.95 : 1 }}
                        onClick={() => handleCircuitTileClick(index)}
                        className={`w-8 h-8 rounded border cursor-pointer flex items-center justify-center text-xs font-bold transition-all ${
                          tile.type === 'power' 
                            ? 'bg-green-500 text-white border-green-400 shadow-lg shadow-green-300' 
                            : tile.type === 'target' 
                            ? 'bg-red-500 text-white border-red-400' 
                            : tile.type === 'wire' 
                            ? 'bg-blue-400 text-white border-blue-300' 
                            : tile.type === 'component' 
                            ? 'bg-amber-500 text-white border-amber-400' 
                            : selectedComponentType && !canPlace
                            ? 'bg-red-800 border-red-600 cursor-not-allowed opacity-50'
                            : selectedComponentType && canPlace
                            ? 'bg-slate-700 border-amber-400 hover:bg-slate-600'
                            : 'bg-slate-800 border-slate-600 hover:bg-slate-700'
                        }`}
                      >
                        {tile.type === 'power' && '⚡'}
                        {tile.type === 'target' && '🎯'}
                        {tile.type === 'wire' && '─'}
                        {tile.type === 'component' && tile.component && (
                          tile.component === 'resistor' ? 'R' :
                          tile.component === 'capacitor' ? 'C' :
                          tile.component === 'led' ? 'L' : 'S'
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">🧠 Strategic Rules:</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>• <strong>Resistors (R):</strong> Control current - place first, closer to power</div>
                    <div>• <strong>Capacitors (C):</strong> Store energy - place after resistors</div>
                    <div>• <strong>LEDs (L):</strong> Need current limiting - require resistor in circuit</div>
                    <div>• <strong>Switches (S):</strong> Control flow - most effective near power source</div>
                  </div>
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-xs text-gray-500">
                    {selectedComponentType ? 
                      `Placing: ${selectedComponentType.toUpperCase()} components` : 
                      'Placing: WIRE connections'
                    }
                  </p>
                  <p className="text-xs text-gray-400">
                    Connect ⚡ (power) to 🎯 (target) following component order rules
                  </p>
                </div>
              </motion.div>
            )}

            {phase === 'puzzle' && puzzleType === 'pattern' && (
              <motion.div
                key="pattern"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                  <Brain size={20} className="text-purple-500" />
                  pattern memory
                </h3>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  memorize and repeat the pattern (attempts: {attempts}/{maxAttempts})
                </p>
                
                {patternShowTime > 0 ? (
                  <div className="mb-4">
                    <div className="flex justify-center gap-2 mb-3">
                      {patternSequence.map((color, index) => (
                        <motion.div
                          key={index}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.2 }}
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                        >
                          {color}
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-sm text-center text-purple-600 font-medium">
                      Memorize this pattern...
                    </p>
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex justify-center gap-2 mb-3">
                      {playerPattern.map((color, index) => (
                        <div key={index} className="w-8 h-8 rounded-full flex items-center justify-center text-lg">
                          {color}
                        </div>
                      ))}
                      {playerPattern.length < patternSequence.length && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">?</span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['🔴', '🟢', '🔵', '🟡', '🟠', '🟣'].slice(0, 4 + difficultyLevel).map((color) => (
                        <motion.button
                          key={color}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handlePatternColorClick(color)}
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl hover:ring-2 hover:ring-purple-300 transition-all"
                        >
                          {color}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
                
                {patternShowTime > 0 && (
                  <button
                    onClick={() => setPatternShowTime(0)}
                    className="w-full py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                  >
                    I've memorized it!
                  </button>
                )}
              </motion.div>
            )}

            {phase === 'puzzle' && puzzleType === 'reaction' && (
              <motion.div
                key="reaction"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h3 className="text-lg font-medium text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
                  <Target size={20} className="text-red-500" />
                  reaction time
                </h3>
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <div className="flex items-center gap-1">
                      <Clock size={16} className={reactionTimeLeft <= 3 ? "text-red-500" : "text-blue-500"} />
                      <span className={`text-sm font-medium ${reactionTimeLeft <= 3 ? "text-red-600" : ""}`}>
                        {reactionTimeLeft}s
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-yellow-500" />
                      <span className="text-sm font-medium">{reactionScore} hits</span>
                    </div>
                    {totalTargetsSpawned > 0 && (
                      <div className="flex items-center gap-1">
                        <Target size={16} className="text-purple-500" />
                        <span className="text-sm text-purple-600">{totalTargetsSpawned} spawned</span>
                      </div>
                    )}
                  </div>
                  
                  {reactionGameActive ? (
                    <p className="text-sm text-gray-600">
                      Click the targets as fast as you can!
                    </p>
                  ) : reactionTimeLeft === 0 ? (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-800">Game Over!</p>
                      {totalTargetsSpawned > 0 && (
                        <div className="text-xs text-gray-600">
                          <div>Hit Rate: {Math.round((reactionScore / totalTargetsSpawned) * 100)}%</div>
                          <div>
                            {reactionScore >= Math.ceil(totalTargetsSpawned * 0.8) ? (
                              <span className="text-green-600 font-medium">🎉 Perfect! Excellent reflexes!</span>
                            ) : reactionScore >= Math.max(5, Math.ceil(totalTargetsSpawned * 0.6)) ? (
                              <span className="text-blue-600 font-medium">✅ Good job! Completed!</span>
                            ) : (
                              <span className="text-red-600">❌ Need {Math.max(5, Math.ceil(totalTargetsSpawned * 0.6)) - reactionScore} more hits</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Get ready... Game starting soon!
                    </p>
                  )}
                </div>
                
                <div 
                  className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg h-80 mb-4 overflow-hidden"
                  style={{ touchAction: 'none' }}
                >
                  {reactionTargets.map((target) => (
                    <motion.div
                      key={target.id}
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      exit={{ scale: 0 }}
                      whileHover={{ scale: 1.2 }}
                      onClick={() => handleReactionTargetClick(target.id, target.x, target.y)}
                      className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 cursor-pointer flex items-center justify-center text-white font-bold shadow-lg hover:shadow-xl transition-all"
                      style={{
                        left: `${target.x}%`,
                        top: `${target.y}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10
                      }}
                    >
                      <Target size={16} />
                    </motion.div>
                  ))}
                  
                  {hitEffects.map((effect) => (
                    <motion.div
                      key={effect.id}
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute w-10 h-10 rounded-full pointer-events-none flex items-center justify-center"
                      style={{
                        left: `${effect.x}%`,
                        top: `${effect.y}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 5
                      }}
                    >
                      <div className="text-2xl font-bold text-green-500">+1</div>
                    </motion.div>
                  ))}
                  
                  {!reactionGameActive && reactionTimeLeft === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg"
                      style={{ zIndex: 20 }}
                    >
                      <div className="text-center text-white">
                        <div className="text-4xl mb-2">⏰</div>
                        <div className="text-xl font-bold">Time's Up!</div>
                        <div className="text-sm opacity-75">
                          {reactionScore >= Math.max(5, Math.ceil(totalTargetsSpawned * 0.6)) ? 
                            "Processing results..." : 
                            attempts < maxAttempts ? "Get ready for next attempt..." : "Game Over"
                          }
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {reactionGameActive && reactionTimeLeft <= 3 && reactionTimeLeft > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 pointer-events-none flex items-center justify-center"
                      style={{ zIndex: 15 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="text-6xl font-bold text-red-500 text-center"
                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                      >
                        {reactionTimeLeft}
                      </motion.div>
                    </motion.div>
                  )}
                  
                  {reactionTargets.length === 0 && reactionTimeLeft > 3 && reactionGameActive && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-gray-400 text-center">
                        <Target size={32} className="mx-auto mb-2" />
                        <p className="text-sm">Targets will appear...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  Click the red targets as they appear!
                </p>
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
                <motion.div 
                  className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: 2
                  }}
                >
                  <CheckCircle size={32} className="text-white" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4"
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
                    <Sparkles size={24} className="text-yellow-500" />
                    Puzzle Complete!
                    <Sparkles size={24} className="text-yellow-500" />
                  </h3>
                  <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {puzzleType === 'memory' && <Brain size={16} className="text-green-500" />}
                      {puzzleType === 'sequence' && <Zap size={16} className="text-blue-500" />}
                      {puzzleType === 'connect' && <Share2 size={16} className="text-purple-500" />}
                      {puzzleType === 'circuit' && <Zap size={16} className="text-amber-500" />}
                      {puzzleType === 'pattern' && <Brain size={16} className="text-purple-500" />}
                      {puzzleType === 'reaction' && <Target size={16} className="text-red-500" />}
                      <span className="font-semibold text-green-700 capitalize">{puzzleType} Challenge Mastered!</span>
                    </div>
                    <p className="text-sm text-center text-green-600">
                      {attempts === 0 && perfectScore && '🎯 Perfect Score! Flawless performance!'}
                      {attempts === 0 && !perfectScore && '✨ Excellent! First try success!'}
                      {attempts === 1 && '👍 Great job! Completed on second attempt!'}
                      {attempts === 2 && '💪 Well done! Third time\'s the charm!'}
                      {attempts > 2 && '🎉 Persistence pays off! Challenge completed!'}
                      {puzzleType === 'reaction' && perfectScore && '⚡ Lightning reflexes!'}
                    </p>
                  </div>
                </motion.div>
                
                {resourceCosts.length > 0 && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1">
                      <Package size={14} />
                      Resources will be consumed:
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {resourceCosts.map((cost, index) => {
                        const resource = getResourceById(cost.resourceId);
                        const playerHas = playerResources?.[cost.resourceId] || 0;
                        const remaining = playerHas - cost.quantity;
                        
                        return (
                          <div key={index} className="text-center bg-white/60 backdrop-blur-sm p-2 rounded">
                            <div className="text-lg mb-1">{resource?.icon}</div>
                            <div className="text-xs text-green-700">-{cost.quantity}</div>
                            <div className="text-xs text-gray-600">{playerHas} → {remaining}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    if (onResourceUpdate && resourceCosts.length > 0) {
                      const newResources = getRemainingResources();
                      onResourceUpdate(newResources);
                    }
                    
                    completeCallbackRef.current(buildingRef.current, selectedIndexRef.current);
                    
                    setPhase('building');
                  }}
                  className="w-full py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
                >
                  Build & Place {building.name}
                </button>
              </motion.div>
            )}
            
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}