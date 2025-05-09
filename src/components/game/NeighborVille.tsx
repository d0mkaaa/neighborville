import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Home, Zap, User, Calendar, Settings, Award, AlertCircle, X, CheckCircle } from "lucide-react";
import AppLayout from "../ui/AppLayout";
import GameHeader from "./GameHeader";
import BuildingOption from "./BuildingOption";
import GameGrid from "./GameGrid";
import NeighborCard from "./NeighborCard";
import NotificationSystem from "./NotificationSystem";
import SaveManager from "./SaveManager";
import HappinessAnalytics from "./HappinessAnalytics";
import PlotExpansion from "./PlotExpansion";
import EnergyUsagePanel from "./EnergyUsagePanel";
import ResidentAssignment from "./ResidentAssignment";
import BillsPanel from "./BillsPanel";
import TutorialGuide from "./TutorialGuide";
import { buildings as initialBuildings } from "../../data/buildings";
import { neighborProfiles } from "../../data/neighbors";
import { ACHIEVEMENTS } from "../../data/achievements";
import type { 
  Building, GameEvent, Neighbor, ScheduledEvent,
  GameProgress, Achievement, RecentEvent, Bill, TimeOfDay
} from "../../types/game";
import type { ExtendedNotification } from "./NotificationSystem";

interface NeighborVilleProps {
  initialGameState?: GameProgress | null;
}

export default function NeighborVille({ initialGameState }: NeighborVilleProps) {
  const [playerName, setPlayerName] = useState("");
  const [coins, setCoins] = useState(1000);
  const [happiness, setHappiness] = useState(70);
  const [day, setDay] = useState(1);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [gridSize, setGridSize] = useState<number>(16); 
  const [grid, setGrid] = useState<(Building | null)[]>(Array(64).fill(null)); 
  
  const [gameTime, setGameTime] = useState<number>(12); 
  const [gameMinutes, setGameMinutes] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [timePaused, setTimePaused] = useState(false);
  
  const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showHappinessAnalytics, setShowHappinessAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [activeTab, setActiveTab] = useState('buildings');
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [neighbors, setNeighbors] = useState<Neighbor[]>(neighborProfiles);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [bills, setBills] = useState<Bill[]>([]);
  
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'cloudy' | 'stormy'>('sunny');
  const [totalEnergyUsage, setTotalEnergyUsage] = useState<number>(0);
  const [energyRate, setEnergyRate] = useState<number>(2);
  const [lastBillDay, setLastBillDay] = useState<number>(0);
  const [daysUntilBill, setDaysUntilBill] = useState<number>(5);

  useEffect(() => {
    if (initialGameState) {
      loadGameState(initialGameState);
    } else {
      initializeNewGame();
      setShowTutorial(true);
    }
  }, [initialGameState]);

  const initializeNewGame = () => {
    const name = initialGameState?.playerName || "Mayor";
    setPlayerName(name);
    setCoins(1000);
    setHappiness(70);
    setDay(1);
    setLevel(1);
    setExperience(0);
    setGridSize(16);
    setGrid(Array(64).fill(null));
    setWeather('sunny');
  };

  const loadGameState = (state: GameProgress) => {
    setPlayerName(state.playerName);
    setCoins(state.coins);
    setHappiness(state.happiness);
    setDay(state.day);
    setLevel(state.level || 1);
    setExperience(state.experience || 0);
    setGrid(state.grid);
    setGridSize(state.gridSize || 16);
    setGameTime(state.gameTime || 12);
    setTimeOfDay(state.timeOfDay || 'day');
    setBills(state.bills || []);
    setTotalEnergyUsage(state.totalEnergyUsage || 0);
    setEnergyRate(state.energyRate || 2);
    setLastBillDay(state.lastBillDay || 0);
    
    const currentLevel = state.level || 1;
    const unlockedBuildings = initialBuildings.map(building => ({
      ...building,
      unlocked: building.levelRequired ? currentLevel >= building.levelRequired : true
    }));
    setBuildings(unlockedBuildings);
  };

  const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', autoRemove: boolean = true) => {
    const newNotification: ExtendedNotification = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      autoRemove
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const handleBuildingSelect = (building: Building) => {
    if (!building.unlocked) {
      addNotification(`Unlock ${building.name} at level ${building.levelRequired}`, 'warning');
      return;
    }
    
    setSelectedBuilding(building);
    setSelectedTile(null);
    addNotification(`Selected: ${building.name}`, 'info');
  };

  const handleTileClick = (index: number) => {
    if (index >= gridSize) return;
    
    if (selectedBuilding && grid[index] === null) {
      if (coins >= selectedBuilding.cost) {
        const newGrid = [...grid];
        newGrid[index] = selectedBuilding;
        
        setGrid(newGrid);
        setCoins(coins - selectedBuilding.cost);
        setHappiness(Math.min(100, happiness + selectedBuilding.happiness));
        
        addNotification(`Built a ${selectedBuilding.name} (+${selectedBuilding.happiness}% happiness)`, 'success');
        setSelectedBuilding(null);
        calculateEnergyUsage(newGrid);
      } else {
        addNotification('Not enough coins', 'error');
      }
    } else if (!selectedBuilding && grid[index] !== null) {
      setSelectedTile(index);
    } else {
      setSelectedTile(null);
    }
  };

  const handleDeleteBuilding = (index: number) => {
    if (index >= gridSize) return;
    
    const buildingToDelete = grid[index];
    if (!buildingToDelete) return;
    
    const newGrid = [...grid];
    newGrid[index] = null;
    
    setGrid(newGrid);
    setCoins(coins + Math.floor(buildingToDelete.cost * 0.5));
    setHappiness(Math.max(0, happiness - Math.floor(buildingToDelete.happiness * 0.7)));
    
    addNotification(`Demolished a ${buildingToDelete.name}`, 'info');
    setSelectedTile(null);
    calculateEnergyUsage(newGrid);
  };

  const calculateEnergyUsage = (currentGrid = grid) => {
    let usage = 0;
    currentGrid.forEach(building => {
      if (building && building.energyUsage !== undefined) {
        usage += building.energyUsage;
      }
    });
    setTotalEnergyUsage(usage);
  };

  const handleEndDay = () => {
    const baseIncome = grid.slice(0, gridSize).reduce((total, building) => {
      if (building) {
        return total + building.income;
      }
      return total;
    }, 0);
    
    const energyCost = totalEnergyUsage > 0 ? Math.round(totalEnergyUsage * energyRate) : 0;
    const netIncome = baseIncome - energyCost;
    
    setCoins(coins + netIncome);
    setDay(day + 1);
    
    const newDaysUntilBill = daysUntilBill - 1;
    setDaysUntilBill(newDaysUntilBill);
    
    if (newDaysUntilBill <= 0) {
      generateEnergyBill();
      setDaysUntilBill(5);
      setLastBillDay(day + 1);
    }
    
    addNotification(`Day ${day} complete! Earned ${netIncome} coins (${baseIncome} income - ${energyCost} energy cost)`, 'success');
    saveGame();
  };

  const generateEnergyBill = () => {
    const billAmount = Math.max(0, Math.round(totalEnergyUsage * energyRate));
    
    if (billAmount <= 0) return;
    
    const newBill: Bill = {
      id: `energy_${Date.now()}`,
      name: 'Energy Bill',
      amount: billAmount,
      dayDue: day + 3,
      isPaid: false,
      icon: 'Energy'
    };
    
    setBills(prevBills => [...prevBills, newBill]);
    addNotification(`Energy bill generated: ${billAmount} coins due in 3 days`, 'warning');
  };

  const handlePayBill = (billId: string) => {
    const billToPay = bills.find(bill => bill.id === billId);
    
    if (!billToPay || billToPay.isPaid) return;
    
    if (coins >= billToPay.amount) {
      setCoins(coins - billToPay.amount);
      
      setBills(prevBills => 
        prevBills.map(bill => 
          bill.id === billId ? { ...bill, isPaid: true } : bill
        )
      );
      
      addNotification(`Paid ${billToPay.name}: ${billToPay.amount} coins`, 'success');
    } else {
      addNotification('Not enough coins to pay this bill', 'error');
    }
  };

  const toggleTimePause = () => {
    setTimePaused(!timePaused);
  };

  const handleTimeChange = (newTime: number, newTimeOfDay: TimeOfDay) => {
    setGameTime(newTime);
    setTimeOfDay(newTimeOfDay);
  };

  const handleShowHappinessAnalytics = () => {
    setShowHappinessAnalytics(true);
  };

  const handleAssignResident = (neighborId: number, houseIndex: number) => {
    const updatedNeighbors = neighbors.map(neighbor => {
      if (neighbor.id === neighborId) {
        return {
          ...neighbor,
          hasHome: true,
          houseIndex
        };
      }
      return neighbor;
    });
    
    const updatedGrid = [...grid];
    if (updatedGrid[houseIndex]) {
      updatedGrid[houseIndex] = {
        ...updatedGrid[houseIndex]!,
        isOccupied: true,
        occupantId: neighborId
      };
    }
    
    setNeighbors(updatedNeighbors);
    setGrid(updatedGrid);
    
    const neighbor = neighbors.find(n => n.id === neighborId);
    if (neighbor) {
      setHappiness(Math.min(100, happiness + 10));
      addNotification(`${neighbor.name} moved into house #${houseIndex} (+10% happiness)`, 'success');
    }
    
    calculateEnergyUsage(updatedGrid);
  };

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveGame(undefined, true);
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [playerName]);

  useEffect(() => {
    if (playerName) {
      saveGame(undefined, true);
    }
  }, [day, level, gridSize]);

  const saveGame = async (name?: string, isAutoSave: boolean = false) => {
    setAutoSaving(true);
    
    const gameProgress: GameProgress = {
      playerName,
      coins,
      happiness,
      day,
      level,
      experience,
      grid,
      gridSize,
      neighbors,
      achievements,
      events: [],
      gameTime,
      timeOfDay,
      recentEvents: [],
      bills,
      energyRate,
      totalEnergyUsage,
      lastBillDay
    };
    
    try {
      let saveKey;
      
      if (isAutoSave) {
        saveKey = `neighborville_autosave_${playerName.replace(/\s+/g, '_')}`;
      } else if (name) {
        const timestamp = Date.now();
        saveKey = `neighborville_save_${name}_${timestamp}`;
      } else {
        saveKey = `neighborville_save`;
      }
      
      localStorage.setItem(saveKey, JSON.stringify(gameProgress));
      setLastSaveTime(new Date());
      
      if (!isAutoSave && !name) {
        addNotification('Game saved!', 'success');
      }
    } catch (error) {
      console.error('Failed to save game', error);
      if (!isAutoSave) {
        addNotification('Failed to save game', 'error');
      }
    } finally {
      setAutoSaving(false);
    }
  };

  return (
    <AppLayout 
      header={
        <div>
          <GameHeader
            playerName={playerName}
            coins={coins}
            happiness={happiness}
            day={day}
            level={level}
            experience={experience}
            gameTime={gameTime}
            gameMinutes={gameMinutes}
            timePaused={timePaused}
            timeOfDay={timeOfDay}
            weather={weather}
            hasUnpaidBills={bills.some(bill => !bill.isPaid && bill.dayDue <= day)}
            achievements={achievements}
            onEndDay={handleEndDay}
            onOpenSaveManager={() => setShowSaveManager(true)}
            onShowSettings={() => setShowSettings(true)}
            onShowTutorial={() => setShowTutorial(true)}
            onShowAchievements={() => {}}
            onToggleTimePause={toggleTimePause}
            onTimeChange={handleTimeChange}
            onShowHappinessAnalytics={handleShowHappinessAnalytics}
          />
          
          <AnimatePresence>
            {autoSaving && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-lg"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Auto-saving...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      }
      timeOfDay={timeOfDay}
    >
      <NotificationSystem 
        notifications={notifications}
        removeNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />
      
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-3 gap-1 p-1">
                {['buildings', 'utilities', 'neighbors'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium lowercase flex items-center justify-center gap-1 transition-colors ${
                      activeTab === tab ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'buildings' && <Home size={16} />}
                    {tab === 'utilities' && <Zap size={16} />}
                    {tab === 'neighbors' && <User size={16} />}
                    <span className="capitalize">{tab}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {activeTab === 'buildings' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4">
                <h2 className="font-medium mb-3 lowercase text-emerald-800">available buildings</h2>
                <div className="grid grid-cols-2 gap-2">
                  {buildings.map((building) => (
                    <BuildingOption 
                      key={building.id}
                      building={building}
                      isSelected={selectedBuilding?.id === building.id}
                      onSelect={handleBuildingSelect}
                      playerLevel={level}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'utilities' && (
              <div className="space-y-4">
                <EnergyUsagePanel
                  grid={grid}
                  energyRate={energyRate}
                  totalEnergyUsage={totalEnergyUsage}
                  daysUntilBill={daysUntilBill}
                />
                
                <BillsPanel
                  bills={bills}
                  onPayBill={handlePayBill}
                  coins={coins}
                  currentDay={day}
                />
                
                <PlotExpansion
                  currentSize={gridSize}
                  maxSize={64}
                  coins={coins}
                  onExpand={(newSize, cost) => {
                    if (coins >= cost) {
                      setCoins(coins - cost);
                      setGridSize(newSize);
                      addNotification(`Plot expanded to ${Math.sqrt(newSize)}×${Math.sqrt(newSize)}!`, 'success');
                    }
                  }}
                />
              </div>
            )}
            
            {activeTab === 'neighbors' && (
              <div className="space-y-4">
                <ResidentAssignment
                  neighbors={neighbors}
                  grid={grid}
                  onAssignResident={handleAssignResident}
                />
              </div>
            )}
          </div>
          
          <div className="col-span-9">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-4">
              <GameGrid 
                grid={grid}
                gridSize={gridSize}
                maxSize={64}
                selectedBuilding={selectedBuilding}
                selectedTile={selectedTile}
                onTileClick={handleTileClick}
                onDeleteBuilding={handleDeleteBuilding}
              />
            </div>
          </div>
        </div>
      </div>
      
      <SaveManager 
        isOpen={showSaveManager}
        onClose={() => setShowSaveManager(false)}
        onSave={(name) => saveGame(name)}
        gameData={{
          playerName,
          coins,
          happiness,
          day,
          level,
          experience,
          grid,
          gridSize,
          neighbors,
          achievements,
          events: [],
          gameTime,
          timeOfDay,
          recentEvents: [],
          bills,
          energyRate,
          totalEnergyUsage,
          lastBillDay
        }}
      />

      <AnimatePresence>
        {showHappinessAnalytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
            onClick={() => setShowHappinessAnalytics(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <HappinessAnalytics
                happiness={happiness}
                buildings={buildings}
                neighbors={neighbors}
                grid={grid}
                recentEvents={[]}
              />
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowHappinessAnalytics(false)}
                  className="w-full py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors lowercase"
                >
                  close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTutorial && (
          <TutorialGuide 
            step={tutorialStep}
            onNextStep={() => {
              if (tutorialStep < 4) {
                setTutorialStep(tutorialStep + 1);
              } else {
                setShowTutorial(false);
                addNotification('Tutorial completed! Happy building!', 'success');
              }
            }}
            onClose={() => {
              setShowTutorial(false);
              addNotification('You can access the tutorial anytime from the help button', 'info');
            }}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}