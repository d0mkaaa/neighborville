import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Save, Award, AlertCircle } from "lucide-react";
import { buildings } from "../../data/buildings";
import { neighborProfiles } from "../../data/neighbors";
import { possibleEvents, getRandomEvent } from "../../data/events";
import { ACHIEVEMENTS } from "../../data/achievements";
import { timeBasedBonuses } from "../../data/timeBonus";
import type { 
  Building, GameEvent, Neighbor, ScheduledEvent,
  GameProgress, Achievement, RecentEvent, Bill, TimeOfDay, TimeBasedBonus
} from "../../types/game";
import type { ExtendedNotification } from "./NotificationSystem";
import BuildingOption from "./BuildingOption";
import GameGrid from "./GameGrid";
import NeighborCard from "./NeighborCard";
import NotificationSystem from "./NotificationSystem";
import TutorialGuide from "./TutorialGuide";
import ProgressBar from "./ProgressBar";
import Login from "./Login";
import SaveManager from "./SaveManager";
import NeighborUnlockModal from "./NeighborUnlockModal";
import DayNightCycle from "./DayNightCycle";
import PlotExpansion from "./PlotExpansion";
import HappinessAnalytics from "./HappinessAnalytics";
import EnergyUsagePanel from "./EnergyUsagePanel";
import BillsPanel from "./BillsPanel";
import TimeBonus from "./TimeBonus";
import ResidentAssignment from "./ResidentAssignment";
import EventModal from "./EventModal";

const generateId = () => Math.random().toString(36).substring(2, 9);
const SAVE_KEY = "neighborville_save";
const DEFAULT_ENERGY_RATE = 2;
const BILL_CYCLE_DAYS = 7;

export default function neighborville() {
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [coins, setCoins] = useState(1000);
  const [happiness, setHappiness] = useState(70);
  const [day, setDay] = useState(1);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [neighbors, setNeighbors] = useState<Neighbor[]>([]);
  const [showNeighborInfo, setShowNeighborInfo] = useState<Neighbor | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [gridSize, setGridSize] = useState<number>(16); 
  const [grid, setGrid] = useState<(Building | null)[]>(Array(64).fill(null)); 
  const [justUnlockedNeighbor, setJustUnlockedNeighbor] = useState<Neighbor | null>(null);
  const [gameTime, setGameTime] = useState<number>(12); 
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [randomEventProbability, setRandomEventProbability] = useState<number>(0.3);
  const [randomEventDay, setRandomEventDay] = useState<number>(0);
  
  const [energyRate, setEnergyRate] = useState<number>(DEFAULT_ENERGY_RATE);
  const [totalEnergyUsage, setTotalEnergyUsage] = useState<number>(0);
  const [bills, setBills] = useState<Bill[]>([]);
  const [lastBillDay, setLastBillDay] = useState<number>(0);
  const [daysUntilBill, setDaysUntilBill] = useState<number>(BILL_CYCLE_DAYS);
  const [activeBonuses, setActiveBonuses] = useState<TimeBasedBonus[]>([]);
  
  const gridRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      const savedGame = localStorage.getItem(SAVE_KEY);
      if (savedGame) {
        try {
          const parsed = JSON.parse(savedGame) as GameProgress;
          addNotification('saved game found', 'info', true);
        } catch (error) {
          console.error('Failed to parse saved game', error);
        }
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (gameStarted) {
      setNeighbors(neighborProfiles);
      
      setEvents([
        { eventId: 'block_party', dayTrigger: 3 },
        { eventId: 'tree_planting', dayTrigger: 6 },
        { eventId: 'power_outage', dayTrigger: 10 },
        { eventId: 'food_truck_friday', dayTrigger: 5 },
        { eventId: 'noise_complaint', dayTrigger: 7 }
      ]);
      
      if (!tutorialCompleted) {
        setShowTutorial(true);
      } else {
        addNotification('welcome to your new neighborhood', 'info');
      }
      
      calculateTotalEnergyUsage();
    }
  }, [gameStarted, tutorialCompleted]);
  
  useEffect(() => {
    if (gameStarted && day > 1) {
      const todayEvent = events.find(e => e.dayTrigger === day);
      if (todayEvent) {
        const eventDetails = possibleEvents.find(e => e.id === todayEvent.eventId);
        if (eventDetails) {
          if (!eventDetails.timeOfDay || eventDetails.timeOfDay === timeOfDay) {
            setCurrentEvent(eventDetails);
            setModalOpen(true);
          }
        }
      }
    }
  }, [day, events, gameStarted, timeOfDay]);

  useEffect(() => {
    if (gameStarted) {
      const currentBonuses = timeBasedBonuses.filter(bonus => bonus.timeOfDay === timeOfDay);
      setActiveBonuses(currentBonuses);
    }
  }, [timeOfDay, gameStarted]);
  
  useEffect(() => {
    if (gameStarted && autoSaveEnabled && day > 1) {
      const autoSaveTimer = setTimeout(() => {
        saveGame('autosave');
      }, 60000);
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [gameStarted, day, autoSaveEnabled]);
  
  useEffect(() => {
    if (gameStarted) {
      const nextBillDay = lastBillDay + BILL_CYCLE_DAYS;
      const daysRemaining = nextBillDay - day;
      setDaysUntilBill(daysRemaining > 0 ? daysRemaining : 0);
    }
  }, [day, lastBillDay, gameStarted]);

  useEffect(() => {
    if (gameStarted) {
      calculateTotalEnergyUsage();
    }
  }, [grid, gameStarted]);
  
  useEffect(() => {
    if (gameStarted) {
      let updatedAchievements = [...achievements];
      let achievementChanged = false;
      
      const buildingTypes = new Set(grid.filter(b => b !== null).map(b => b!.id));
      const totalBuildings = grid.filter(b => b !== null).length;
      
      for (const achievement of updatedAchievements) {
        if (achievement.completed) continue;
        
        let shouldComplete = false;
        
        switch (achievement.id) {
          case 'first_building':
            shouldComplete = grid.some(b => b !== null);
            break;
          case 'three_buildings':
            shouldComplete = buildingTypes.size >= 3;
            break;
          case 'happiness_50':
            shouldComplete = happiness >= 50;
            break;
          case 'happiness_100':
            shouldComplete = happiness >= 100;
            break;
          case 'day_10':
            shouldComplete = day >= 10;
            break;
          case 'coins_2000':
            shouldComplete = coins >= 2000;
            break;
          case 'expand_plot':
            shouldComplete = gridSize > 16;
            break;
          case 'unlock_neighbor':
            shouldComplete = neighbors.filter(n => n.unlocked).length > 3;
            break;
          case 'full_grid':
            shouldComplete = totalBuildings >= gridSize;
            break;
          case 'level_5':
            shouldComplete = level >= 5;
            break;
          case 'max_expansion':
            shouldComplete = gridSize >= 64;
            break;
        }
        
        if (shouldComplete) {
          achievement.completed = true;
          achievementChanged = true;
          addNotification(`achievement unlocked: ${achievement.title}`, 'success');
          addExperience(achievement.xpReward);
        }
      }
      
      if (achievementChanged) {
        setAchievements([...updatedAchievements]);
      }
      
      let updatedNeighbors = [...neighbors];
      let neighborChanged = false;
      
      const buildingCounts: Record<string, number> = {};
      grid.forEach(building => {
        if (building) {
          buildingCounts[building.id] = (buildingCounts[building.id] || 0) + 1;
        }
      });
      
      updatedNeighbors.forEach(neighbor => {
        if (!neighbor.unlocked && neighbor.unlockCondition) {
          const condition = neighbor.unlockCondition;
          let unlocked = false;
          
          switch (condition.type) {
            case 'building':
              if (condition.buildingId && buildingCounts[condition.buildingId] >= (condition.count || 1)) {
                unlocked = true;
              }
              break;
            case 'level':
              if (level >= (condition.level || 1)) {
                unlocked = true;
              }
              break;
            case 'happiness':
              if (happiness >= (condition.level || 1)) {
                unlocked = true;
              }
              break;
            case 'day':
              if (day >= (condition.day || 1)) {
                unlocked = true;
              }
              break;
          }
          
          if (unlocked) {
            neighborChanged = true;
            neighbor.unlocked = true;
            setJustUnlockedNeighbor(neighbor);
            addNotification(`unlocked new neighbor: ${neighbor.name}!`, 'success');
            addExperience(25);
          }
        }
      });
      
      if (neighborChanged) {
        setNeighbors(updatedNeighbors);
      }
    }
  }, [grid, happiness, day, coins, level, gameStarted, achievements, neighbors, gridSize]);
  
  const calculateTotalEnergyUsage = () => {
    let usage = 0;
    grid.forEach(building => {
      if (building && building.energyUsage !== undefined) {
        usage += building.energyUsage;
      }
    });
    setTotalEnergyUsage(usage);
  };
  
  const generateEnergyBill = () => {
    const billAmount = totalEnergyUsage * energyRate;
    
    if (billAmount <= 0) return;
    
    const newBill: Bill = {
      id: `energy_${generateId()}`,
      name: 'Energy Bill',
      amount: billAmount,
      dayDue: day + 1,
      isPaid: false,
      icon: 'Energy'
    };
    
    setBills(prevBills => [...prevBills, newBill]);
    setLastBillDay(day);
    addNotification(`Energy bill generated: ${billAmount} coins due tomorrow`, 'warning');
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
  
  const checkUnpaidBills = () => {
    const unpaidDueBills = bills.filter(bill => !bill.isPaid && bill.dayDue <= day);
    
    if (unpaidDueBills.length > 0) {
      const totalPenalty = unpaidDueBills.length * 5;
      setHappiness(Math.max(0, happiness - totalPenalty));
      
      addNotification(`Unpaid bills reduced happiness by ${totalPenalty}%`, 'error');
      
      const veryOverdueBills = unpaidDueBills.filter(bill => day - bill.dayDue > 3);
      
      if (veryOverdueBills.length > 0) {
        setBills(prevBills => 
          prevBills.map(bill => 
            veryOverdueBills.some(overdue => overdue.id === bill.id) 
              ? { ...bill, isPaid: true } 
              : bill
          )
        );
        
        const overduePenalty = veryOverdueBills.length * 5;
        setHappiness(Math.max(0, happiness - overduePenalty));
        
        addNotification('Some bills were seriously overdue and damaged your reputation!', 'error');
      }
    }
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
      addNotification(`${neighbor.name} moved into house #${houseIndex}`, 'success');
      setHappiness(Math.min(100, happiness + 5));
    }
  };
  
  const collectRent = () => {
    const housedNeighbors = neighbors.filter(n => n.unlocked && n.hasHome);
    let totalRent = 0;
    
    housedNeighbors.forEach(neighbor => {
      if (neighbor.dailyRent) {
        totalRent += neighbor.dailyRent;
      }
    });
    
    if (totalRent > 0) {
      setCoins(coins + totalRent);
      addNotification(`Collected ${totalRent} coins in rent from ${housedNeighbors.length} neighbors`, 'success');
    }
    
    return totalRent;
  };
  
  const calculateTimeBonuses = (baseIncome: number) => {
    let bonusIncome = 0;
    let bonusHappiness = 0;
    
    grid.forEach(building => {
      if (!building) return;
      
      const bonus = activeBonuses.find(b => b.buildingId === building.id);
      
      if (bonus) {
        if (bonus.incomeMultiplier) {
          const incomeBonus = building.income * (bonus.incomeMultiplier - 1);
          bonusIncome += incomeBonus;
        }
        
        if (bonus.happinessMultiplier) {
          const happinessBonus = building.happiness * (bonus.happinessMultiplier - 1);
          bonusHappiness += happinessBonus;
        }
      }
    });
    
    if (bonusHappiness > 0) {
      setHappiness(Math.min(100, happiness + bonusHappiness));
      addNotification(`${timeOfDay} time bonus: +${Math.round(bonusHappiness)}% happiness`, 'success');
    }
    
    return Math.round(bonusIncome);
  };
  
  const addExperience = (amount: number) => {
    const newExperience = experience + amount;
    const experienceToNextLevel = level * 100;
    
    if (newExperience >= experienceToNextLevel) {
      setLevel(level + 1);
      setExperience(newExperience - experienceToNextLevel);
      addNotification(`level up! you're now level ${level + 1}`, 'success');
      setCoins(coins + (level * 100));
    } else {
      setExperience(newExperience);
    }
  };
  
  const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', autoRemove: boolean = true) => {
    const newNotification: ExtendedNotification = {
      id: generateId(),
      message,
      type,
      autoRemove
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };
  
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  const handleStartGame = (name: string) => {
    if (name.trim() === "") {
      addNotification('please enter a name', 'error');
      return;
    }
    
    setPlayerName(name);
    setGameStarted(true);
    addNotification('welcome to neighborville', 'success');
  };
  
  const handleLoadGame = (gameData: GameProgress) => {
    setPlayerName(gameData.playerName);
    setCoins(gameData.coins);
    setHappiness(gameData.happiness);
    setDay(gameData.day);
    setLevel(gameData.level || 1);
    setExperience(gameData.experience || 0);
    setGrid(gameData.grid);
    setGridSize(gameData.gridSize || 36);
    setGameTime(gameData.gameTime || 12);
    setTimeOfDay(gameData.timeOfDay || 'day');
    setRecentEvents(gameData.recentEvents || []);
    setBills(gameData.bills || []);
    setEnergyRate(gameData.energyRate || DEFAULT_ENERGY_RATE);
    setTotalEnergyUsage(gameData.totalEnergyUsage || 0);
    setLastBillDay(gameData.lastBillDay || 0);
    
    const updatedNeighbors = neighborProfiles.map(baseNeighbor => {
      const savedNeighbor = gameData.neighbors.find(n => n.id === baseNeighbor.id);
      if (savedNeighbor) {
        return {
          ...baseNeighbor,
          unlocked: savedNeighbor.unlocked,
          hasHome: savedNeighbor.hasHome || false,
          houseIndex: savedNeighbor.houseIndex,
          dailyRent: savedNeighbor.dailyRent || baseNeighbor.dailyRent
        };
      }
      return baseNeighbor;
    });
    
    setNeighbors(updatedNeighbors);
    setAchievements(gameData.achievements || ACHIEVEMENTS);
    setEvents(gameData.events);
    setGameStarted(true);
    setTutorialCompleted(true);
    
    addNotification('game loaded successfully', 'success');
  };
  
  const handleBuildingSelect = (building: Building) => {
    setSelectedBuilding(building);
    setSelectedTile(null);
    addNotification(`selected: ${building.name}`, 'info');
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
        addExperience(5);
        
        addNotification(`built a ${selectedBuilding.name}`, 'success');
        setSelectedBuilding(null);
      } else {
        addNotification('not enough coins', 'error');
      }
    } 
    else if (!selectedBuilding && grid[index] !== null) {
      setSelectedTile(index);
    } 
    else {
      setSelectedTile(null);
    }
  };
  
  const handleDeleteBuilding = (index: number) => {
    if (index >= gridSize) return;
    
    const buildingToDelete = grid[index];
    if (!buildingToDelete) return;
    
    if (buildingToDelete.isOccupied && buildingToDelete.occupantId) {
      const occupantNeighbor = neighbors.find(n => n.id === buildingToDelete.occupantId);
      
      if (occupantNeighbor) {
        const confirmed = window.confirm(`${occupantNeighbor.name} lives here! Are you sure you want to demolish their home?`);
        
        if (!confirmed) return;
        
        const updatedNeighbors = neighbors.map(neighbor => {
          if (neighbor.id === buildingToDelete.occupantId) {
            return {
              ...neighbor,
              hasHome: false,
              houseIndex: undefined
            };
          }
          return neighbor;
        });
        
        setNeighbors(updatedNeighbors);
        setHappiness(Math.max(0, happiness - 10)); 
        addNotification(`${occupantNeighbor.name} was evicted! Neighborhood happiness decreased.`, 'warning');
      }
    }
    
    const newGrid = [...grid];
    newGrid[index] = null;
    
    setGrid(newGrid);
    setCoins(coins + Math.floor(buildingToDelete.cost * 0.5));
    setHappiness(Math.max(0, happiness - Math.floor(buildingToDelete.happiness * 0.5)));
    
    addNotification(`demolished a ${buildingToDelete.name}`, 'info');
    setSelectedTile(null);
  };
  
  const handleExpandPlot = (newSize: number, cost: number) => {
    if (coins < cost) {
      addNotification('not enough coins to expand', 'error');
      return;
    }
    
    setCoins(coins - cost);
    setGridSize(newSize);
    addExperience(30);
    addNotification(`plot expanded to ${Math.sqrt(newSize)}×${Math.sqrt(newSize)}!`, 'success');
  };
  
  const handleEndDay = () => {
    checkUnpaidBills();
    
    const baseIncome = grid.slice(0, gridSize).reduce((total, building) => {
      if (building) {
        return total + building.income;
      }
      return total;
    }, 0);

    const bonusIncome = calculateTimeBonuses(baseIncome);
    
    const rentIncome = collectRent();

    const totalIncome = baseIncome + bonusIncome + rentIncome;
    
    setCoins(coins + totalIncome);
    setDay(day + 1);
    addExperience(10);

    if ((day - lastBillDay) >= BILL_CYCLE_DAYS) {
      generateEnergyBill();
    }

    const newGameTime = (gameTime + 8) % 24;
    setGameTime(newGameTime);

    let newTimeOfDay: TimeOfDay;
    if (newGameTime >= 5 && newGameTime < 10) {
      newTimeOfDay = 'morning';
    } else if (newGameTime >= 10 && newGameTime < 17) {
      newTimeOfDay = 'day';
    } else if (newGameTime >= 17 && newGameTime < 21) {
      newTimeOfDay = 'evening';
    } else {
      newTimeOfDay = 'night';
    }
    
    setTimeOfDay(newTimeOfDay);
    
    const todayScheduledEvent = events.find(e => e.dayTrigger === day + 1);
    
    if (!todayScheduledEvent && day > randomEventDay && Math.random() < randomEventProbability) {
      const randomEvent = getRandomEvent(day + 1);
      if (randomEvent) {
        if (!randomEvent.timeOfDay || randomEvent.timeOfDay === newTimeOfDay) {
          setCurrentEvent(randomEvent);
          setModalOpen(true);
          setRandomEventDay(day + 1);
          setRandomEventProbability(Math.min(0.7, randomEventProbability + 0.1));
        }
      }
    } else {
      setRandomEventProbability(Math.max(0.2, randomEventProbability - 0.05));
    }
    
    let incomeBreakdown = `Buildings: ${baseIncome} coins`;
    if (bonusIncome > 0) incomeBreakdown += ` | ${timeOfDay} bonus: ${bonusIncome}`;
    if (rentIncome > 0) incomeBreakdown += ` | Rent: ${rentIncome}`;
    
    addNotification(`day ${day} complete! earned ${totalIncome} coins (${incomeBreakdown})`, 'success');
    
    if (day % 3 === 0 && autoSaveEnabled) {
      saveGame('autosave');
    }
  };
  
  const handleEventOption = (option: { coins: number, happiness: number, outcome: string }) => {
    setCoins(coins + option.coins);
    setHappiness(Math.max(0, Math.min(100, happiness + option.happiness)));
    addExperience(15);
    
    if (currentEvent) {
      const newEvent: RecentEvent = {
        id: currentEvent.id,
        name: currentEvent.title,
        happinessImpact: option.happiness,
        coinImpact: option.coins,
        day: day
      };
      
      setRecentEvents(prev => [newEvent, ...prev].slice(0, 5));
    }
    
    addNotification(option.outcome.toLowerCase(), option.happiness > 0 ? 'success' : 'warning');
    setModalOpen(false);
    setCurrentEvent(null);
  };

  const handleNeighborClick = (neighbor: Neighbor) => {
    setShowNeighborInfo(neighbor);
  };
  
  const completeTutorial = () => {
    setShowTutorial(false);
    setTutorialCompleted(true);
    addNotification('tutorial completed! build your neighborhood', 'success');
  };
  
  const saveGame = (savePrefix?: string) => {
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
      events,
      gameTime,
      timeOfDay,
      recentEvents,
      bills,
      energyRate,
      totalEnergyUsage,
      lastBillDay
    };
    
    try {
      const timestamp = Date.now();
      const saveKey = savePrefix 
        ? `${SAVE_KEY}_${savePrefix}_${timestamp}` 
        : `${SAVE_KEY}_${playerName.replace(/\s+/g, '_')}_${timestamp}`;
      
      localStorage.setItem(saveKey, JSON.stringify(gameProgress));
      
      if (!savePrefix) {
        setShowSaveConfirmation(true);
        setTimeout(() => setShowSaveConfirmation(false), 2000);
        addNotification('game saved successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to save game', error);
      addNotification('failed to save game', 'error');
    }
  };
  
  const handleOpenSaveManager = () => {
    setShowSaveManager(true);
  };
  
  const hasUnpaidDueBills = () => {
    return bills.some(bill => !bill.isPaid && bill.dayDue <= day);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-emerald-800 to-teal-700 text-white">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-medium mb-4 lowercase tracking-tight"
        >
          neighborville
        </motion.div>
        <div className="flex space-x-2">
          <motion.div 
            className="w-3 h-3 bg-white rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
          />
          <motion.div 
            className="w-3 h-3 bg-white rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2, ease: "easeInOut" }}
          />
          <motion.div 
            className="w-3 h-3 bg-white rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.4, ease: "easeInOut" }}
          />
        </div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 text-sm lowercase"
        >
          building your neighborhood...
        </motion.div>
      </div>
    );
  }
  
  if (!gameStarted) {
    return (
      <Login 
        onStartGame={handleStartGame}
        onLoadGame={handleLoadGame}
        onShowTutorial={() => setShowTutorial(true)}
      />
    );
  }
  
  return (
    <div className={`min-h-screen transition-all duration-700 ${
        timeOfDay === 'morning' ? 'morning-bg' :
        timeOfDay === 'day' ? 'grass-bg' :
        timeOfDay === 'evening' ? 'evening-bg' :
        'night-bg'
      }`}>
      <NotificationSystem 
        notifications={notifications}
        removeNotification={removeNotification}
      />
      
      <header className={`text-white p-4 shadow-md transition-colors duration-700 ${
        timeOfDay === 'morning' ? 'bg-gradient-to-r from-blue-500 to-emerald-600' :
        timeOfDay === 'day' ? 'bg-emerald-700' :
        timeOfDay === 'evening' ? 'bg-gradient-to-r from-orange-500 to-red-600' :
        'bg-gradient-to-r from-blue-900 to-indigo-900'
      }`}>
        <div className="container mx-auto flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-medium lowercase tracking-tight"
          >
            neighborville
          </motion.h1>
          <div className="flex items-center space-x-6">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center"
            >
              <div className="mr-2 text-xl">💰</div>
              <span className="font-medium lowercase text-base">{coins} coins</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center"
            >
              <div className="mr-2 text-xl">😊</div>
              <div className="w-24 h-4 bg-emerald-900 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${happiness}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-emerald-400"
                  style={{ 
                    background: `linear-gradient(90deg, #34d399 0%, #10b981 ${happiness}%)` 
                  }}
                ></motion.div>
              </div>
              <span className="ml-2 font-medium lowercase text-base">{happiness}%</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-3"
            >
              <div className="flex items-center">
                <div className="mr-2 text-xl">📅</div>
                <span className="font-medium lowercase text-base">day {day}</span>
              </div>

              <DayNightCycle 
                day={day} 
                gameTime={gameTime}
                onTimeChange={(newTime, newTimeOfDay) => {
                  setGameTime(newTime);
                  setTimeOfDay(newTimeOfDay);
                }}
              />
            </motion.div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg shadow-sm px-3 py-1.5 mr-2 flex items-center justify-center"
            >
              <span className="text-emerald-800 font-medium mr-2 text-sm lowercase">level {level}</span>
              <ProgressBar 
                value={experience} 
                maxValue={level * 100} 
                width={80}
              />
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-lg shadow-sm p-1.5 mr-2 flex items-center justify-center cursor-pointer"
              onClick={() => setShowAchievements(true)}
            >
              <Award size={16} className="text-emerald-700 mr-1" />
              <span className="text-emerald-800 text-sm lowercase">
                {achievements.filter(a => a.completed).length}/{achievements.length}
              </span>
            </motion.div>
            
            {hasUnpaidDueBills() && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-red-100 rounded-lg shadow-sm p-1.5 mr-2 flex items-center justify-center"
              >
                <AlertCircle size={16} className="text-red-600 mr-1" />
                <span className="text-red-600 text-sm lowercase">
                  unpaid bills
                </span>
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenSaveManager}
              className="mr-2 bg-white rounded-lg shadow-sm p-1.5 text-emerald-700 flex items-center justify-center hover:bg-emerald-50 transition-colors"
            >
              <Save size={16} className="mr-1" />
              <span className="text-sm lowercase">save</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTutorial(true)}
              className="bg-white rounded-lg shadow-sm p-1.5 text-emerald-700 flex items-center justify-center hover:bg-emerald-50 transition-colors"
            >
              <span className="text-sm lowercase">help</span>
            </motion.button>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-md p-4"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                <User size={20} />
              </div>
              <div>
                <h2 className="font-medium lowercase text-emerald-800">{playerName}</h2>
                <div className="text-sm text-gray-500 lowercase">neighborhood mayor</div>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.03, backgroundColor: "#059669" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleEndDay}
              className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-700 transition-colors lowercase shadow-md"
            >
              end day
            </motion.button>
          </motion.div>
          
          <TimeBonus 
            timeOfDay={timeOfDay}
            activeBonuses={activeBonuses}
          />
          
          <BillsPanel 
            bills={bills}
            onPayBill={handlePayBill}
            coins={coins}
            currentDay={day}
          />
          
          <EnergyUsagePanel
            grid={grid}
            energyRate={energyRate}
            totalEnergyUsage={totalEnergyUsage}
            daysUntilBill={daysUntilBill}
          />
          
          <ResidentAssignment
            neighbors={neighbors}
            grid={grid}
            onAssignResident={handleAssignResident}
          />
          
          <HappinessAnalytics 
            happiness={happiness}
            buildings={buildings}
            neighbors={neighbors.filter(n => n.unlocked)}
            grid={grid}
            recentEvents={recentEvents}
          />
          
          <PlotExpansion 
            currentSize={gridSize}
            maxSize={64}
            coins={coins}
            onExpand={handleExpandPlot}
          />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md p-4"
          >
            <h2 className="font-medium mb-3 lowercase text-emerald-800">available buildings</h2>
            <div className="grid grid-cols-2 gap-2">
              {buildings.map((building) => (
                <BuildingOption 
                  key={building.id}
                  building={building}
                  isSelected={selectedBuilding?.id === building.id}
                  onSelect={handleBuildingSelect}
                />
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-md p-4"
          >
            <h2 className="font-medium mb-3 lowercase text-emerald-800">your neighbors</h2>
            <div className="space-y-2">
              {neighbors.map((neighbor) => (
                <NeighborCard 
                  key={neighbor.id}
                  neighbor={neighbor}
                  onClick={handleNeighborClick}
                />
              ))}
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-3"
        >
          <GameGrid 
            grid={grid}
            gridSize={gridSize}
            maxSize={64}
            selectedBuilding={selectedBuilding}
            selectedTile={selectedTile}
            onTileClick={handleTileClick}
            onDeleteBuilding={handleDeleteBuilding}
          />
        </motion.div>
      </main>
      
      <AnimatePresence>
        {showNeighborInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
            onClick={() => setShowNeighborInfo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">{showNeighborInfo.avatar}</div>
                <div>
                  <h2 className="text-xl font-medium lowercase text-emerald-800">{showNeighborInfo.name}</h2>
                  <div className="text-gray-500 lowercase">{showNeighborInfo.trait}</div>
                  
                  {showNeighborInfo.hasHome ? (
                    <div className="mt-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full inline-block">
                      has a home • pays {showNeighborInfo.dailyRent} coins/day
                    </div>
                  ) : (
                    <div className="mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-block">
                      needs a home
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-4">
                <div className="font-medium mb-2 lowercase text-emerald-700">about</div>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p>{showNeighborInfo.name} has been living in the neighborhood for 3 years. they're known for being {showNeighborInfo.trait.toLowerCase()} and active in community events.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-emerald-700 mb-1 lowercase">likes</div>
                  <div className="text-sm lowercase">{showNeighborInfo.likes}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-red-700 mb-1 lowercase">dislikes</div>
                  <div className="text-sm lowercase">{showNeighborInfo.dislikes}</div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNeighborInfo(null)}
                  className="bg-gray-100 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors lowercase"
                >
                  close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {modalOpen && currentEvent && (
          <EventModal
            event={currentEvent}
            onOptionSelect={handleEventOption}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {showAchievements && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
            onClick={() => setShowAchievements(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-medium mb-4 lowercase text-emerald-800">achievements</h2>
              
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg ${
                      achievement.completed ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center">
                      <Award size={18} className={achievement.completed ? 'text-emerald-500' : 'text-gray-400'} />
                      <div className="ml-2">
                        <div className="font-medium lowercase text-sm">{achievement.title}</div>
                        <div className="text-xs lowercase">{achievement.description}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="flex justify-end mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAchievements(false)}
                  className="bg-emerald-100 text-emerald-800 py-2 px-4 rounded-lg font-medium hover:bg-emerald-200 transition-colors lowercase"
                >
                  close
                </motion.button>
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
                completeTutorial();
              }
            }}
            onClose={completeTutorial}
          />
        )}
      </AnimatePresence>
      
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
          events,
          gameTime,
          timeOfDay,
          recentEvents,
          bills,
          energyRate,
          totalEnergyUsage,
          lastBillDay
        }}
      />
      
      <AnimatePresence>
        {showSaveConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg"
          >
            <div className="flex items-center">
              <Save size={16} className="mr-2" />
              <span className="text-sm lowercase">game saved successfully</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {justUnlockedNeighbor && (
          <NeighborUnlockModal 
            neighbor={justUnlockedNeighbor}
            onClose={() => setJustUnlockedNeighbor(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}