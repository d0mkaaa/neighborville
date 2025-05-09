import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Save, 
  Award, 
  AlertCircle, 
  BarChart,
  Home, 
  Zap,
  FileText,
  Plus,
  Info,
  Settings,
  ChevronRight,
  Calendar,
  Clock,
  Play,
  Pause,
  Lock,
  Check,
  X
} from "lucide-react";
import { buildings as initialBuildings } from "../../data/buildings";
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
import HappinessAnalytics from "./HappinessAnalytics";
import EventModal from "./EventModal";
import BackgroundBubbles from "./BackgroundBubbles";

const generateId = () => Math.random().toString(36).substring(2, 9);
const SAVE_KEY = "neighborville_save";
const DEFAULT_ENERGY_RATE = 2;
const BILL_CYCLE_DAYS = 5;
const RANDOM_EVENT_BASE_CHANCE = 0.2;
const HAPPINESS_DECAY_RATE = 1;
const TIME_SPEED = 400;

export default function NeighborVille() {
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
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
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [buildingInfo, setBuildingInfo] = useState<Building | null>(null);
  const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [showNeighborInfo, setShowNeighborInfo] = useState<Neighbor | null>(null);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showHappinessAnalytics, setShowHappinessAnalytics] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [activeTab, setActiveTab] = useState('buildings');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [randomEventProbability, setRandomEventProbability] = useState<number>(RANDOM_EVENT_BASE_CHANCE);
  const [randomEventDay, setRandomEventDay] = useState<number>(0);
  
  const [energyRate, setEnergyRate] = useState<number>(DEFAULT_ENERGY_RATE);
  const [totalEnergyUsage, setTotalEnergyUsage] = useState<number>(0);
  const [bills, setBills] = useState<Bill[]>([]);
  const [lastBillDay, setLastBillDay] = useState<number>(0);
  const [daysUntilBill, setDaysUntilBill] = useState<number>(BILL_CYCLE_DAYS);
  
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [neighbors, setNeighbors] = useState<Neighbor[]>([]);
  const [justUnlockedNeighbor, setJustUnlockedNeighbor] = useState<Neighbor | null>(null);
  const [activeBonuses, setActiveBonuses] = useState<TimeBasedBonus[]>([]);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'cloudy' | 'stormy'>('sunny');
  const [weatherHappinessEffect, setWeatherHappinessEffect] = useState(0);
  const [weatherEffect, setWeatherEffect] = useState("");

  const [selectedNeighborForHousing, setSelectedNeighborForHousing] = useState<Neighbor | null>(null);
  const [availableHouses, setAvailableHouses] = useState<{index: number, building: Building}[]>([]);
  
  const timeIntervalRef = useRef<number | null>(null);
  
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
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (gameStarted) {
      const unlockedBuildings = initialBuildings.map(building => ({
        ...building,
        unlocked: building.levelRequired ? level >= building.levelRequired : true
      }));
      
      setBuildings(unlockedBuildings);
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
      setRandomWeather();
      
      startTimePassage();
    }
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, [gameStarted, tutorialCompleted, level]);
  
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
      applyTimeBonuses();
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
      
      if (daysRemaining === 0) {
        addNotification("Energy bill due today!", "warning");
      }
    }
  }, [day, lastBillDay, gameStarted]);

  useEffect(() => {
    if (gameStarted) {
      calculateTotalEnergyUsage();
    }
  }, [grid, gameStarted]);
  
  useEffect(() => {
    if (gameStarted) {
      checkAchievements();
      checkNeighborUnlocks();
    }
  }, [grid, happiness, day, coins, level, gameStarted]);
  
  useEffect(() => {
    if (gameStarted) {
      updateAvailableHouses();
    }
  }, [grid, neighbors, gameStarted]);
  
  const startTimePassage = () => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
    }
    
    timeIntervalRef.current = window.setInterval(() => {
      if (!timePaused) {
        setGameMinutes(prev => {
          const newMinutes = prev + 1;
          if (newMinutes >= 60) {
            setGameTime(time => {
              const newHour = (time + 1) % 24;
              updateTimeOfDay(newHour);
              return newHour;
            });
            return 0;
          }
          return newMinutes;
        });
      }
    }, TIME_SPEED);
    
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  };
  
  const updateTimeOfDay = (hour: number) => {
    let newTimeOfDay: TimeOfDay;
    if (hour >= 5 && hour < 10) {
      newTimeOfDay = 'morning';
    } else if (hour >= 10 && hour < 17) {
      newTimeOfDay = 'day';
    } else if (hour >= 17 && hour < 21) {
      newTimeOfDay = 'evening';
    } else {
      newTimeOfDay = 'night';
    }
    
    if (newTimeOfDay !== timeOfDay) {
      setTimeOfDay(newTimeOfDay);
      addNotification(`Time of day changed to ${newTimeOfDay}`, 'info', true);
    }
  };
  
  const updateAvailableHouses = () => {
    const houses = grid.map((building, index) => {
      if (building && 
         (building.id === 'house' || building.id === 'apartment') && 
         !building.isOccupied) {
        return { index, building };
      }
      return null;
    }).filter(item => item !== null) as {index: number, building: Building}[];
    
    setAvailableHouses(houses);
  };
  
  const setRandomWeather = () => {
    const weatherTypes: Array<'sunny' | 'rainy' | 'cloudy' | 'stormy'> = ['sunny', 'rainy', 'cloudy', 'stormy'];
    const newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    setWeather(newWeather);
    
    let effect = 0;
    let effectDesc = "";
    
    switch(newWeather) {
      case 'sunny':
        effect = 5;
        effectDesc = "The sunny weather is boosting happiness!";
        break;
      case 'rainy':
        effect = -2;
        effectDesc = "The rainy weather is slightly decreasing happiness.";
        break;
      case 'cloudy':
        effect = 0;
        effectDesc = "The cloudy weather has no effect on happiness.";
        break;
      case 'stormy':
        effect = -5;
        effectDesc = "The stormy weather is decreasing happiness.";
        break;
    }
    
    setWeatherHappinessEffect(effect);
    setWeatherEffect(effectDesc);
    
    setHappiness(prev => Math.min(100, Math.max(0, prev + effect)));
    
    if (effect !== 0) {
      addNotification(effectDesc, effect > 0 ? 'info' : 'warning');
    }
  };
  
  const applyTimeBonuses = () => {
    let bonusHappiness = 0;
    
    grid.forEach(building => {
      if (!building) return;
      
      const bonus = activeBonuses.find(b => b.buildingId === building.id);
      
      if (bonus && bonus.happinessMultiplier) {
        const happinessBonus = building.happiness * (bonus.happinessMultiplier - 1);
        bonusHappiness += happinessBonus;
      }
    });
    
    if (bonusHappiness > 0) {
      setHappiness(prev => Math.min(100, prev + bonusHappiness));
      addNotification(`${timeOfDay} time bonus: +${Math.round(bonusHappiness)}% happiness`, 'success');
    }
  };
  
  const calculateTotalEnergyUsage = () => {
    let usage = 0;
    grid.forEach(building => {
      if (building && building.energyUsage !== undefined) {
        if (building.isOccupied) {
          usage += building.energyUsage * 1.5;
        } else {
          usage += building.energyUsage;
        }
      }
    });
    setTotalEnergyUsage(usage);
  };
  
  const generateEnergyBill = () => {
    const billAmount = Math.max(0, Math.round(totalEnergyUsage * energyRate));
    
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
      
      setHappiness(prev => Math.min(100, prev + 2));
      
      addNotification(`Paid ${billToPay.name}: ${billToPay.amount} coins`, 'success');
    } else {
      addNotification('Not enough coins to pay this bill', 'error');
    }
  };
  
  const checkUnpaidBills = () => {
    const unpaidDueBills = bills.filter(bill => !bill.isPaid && bill.dayDue <= day);
    
    if (unpaidDueBills.length > 0) {
      const totalPenalty = unpaidDueBills.length * 8;
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
        
        const overduePenalty = veryOverdueBills.length * 10;
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
      setHappiness(Math.min(100, happiness + 10));
      addNotification(`${neighbor.name} moved into house #${houseIndex} (+10% happiness)`, 'success');
    }
    
    setSelectedNeighborForHousing(null);
    calculateTotalEnergyUsage();
    updateAvailableHouses();
  };
  
  const collectRent = () => {
    const housedNeighbors = neighbors.filter(n => n.unlocked && n.hasHome);
    let totalRent = 0;
    
    housedNeighbors.forEach(neighbor => {
      if (neighbor.dailyRent) {
        const rentAmount = Math.round(neighbor.dailyRent * (1 + (level * 0.1)));
        totalRent += rentAmount;
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
    
    grid.forEach(building => {
      if (!building) return;
      
      const bonus = activeBonuses.find(b => b.buildingId === building.id);
      
      if (bonus && bonus.incomeMultiplier) {
        const incomeBonus = building.income * (bonus.incomeMultiplier - 1);
        bonusIncome += incomeBonus;
      }
    });
    
    return Math.round(bonusIncome);
  };
  
  const addExperience = (amount: number) => {
    const newExperience = experience + amount;
    const experienceToNextLevel = level * 100;
    
    if (newExperience >= experienceToNextLevel) {
      const newLevel = level + 1;
      setLevel(newLevel);
      setExperience(newExperience - experienceToNextLevel);
      
      const levelBonus = newLevel * 100;
      setCoins(coins + levelBonus);
      
      const newUnlocks = initialBuildings.filter(b => b.levelRequired === newLevel);
      
      if (newUnlocks.length > 0) {
        setBuildings(prevBuildings => prevBuildings.map(building => {
          if (building.levelRequired === newLevel) {
            return { ...building, unlocked: true };
          }
          return building;
        }));
        
        const unlockNames = newUnlocks.map(b => b.name).join(', ');
        addNotification(`level up! you're now level ${newLevel}. unlocked: ${unlockNames}`, 'success');
      } else {
        addNotification(`level up! you're now level ${newLevel}. received ${levelBonus} coins!`, 'success');
      }
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
    
    const unlockedBuildings = initialBuildings.map(building => ({
      ...building,
      unlocked: building.levelRequired ? (gameData.level || 1) >= building.levelRequired : true
    }));
    
    setBuildings(unlockedBuildings);
    
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
    setRandomWeather();
    updateAvailableHouses();
  };
  
  const handleBuildingSelect = (building: Building) => {
    if (!building.unlocked) {
      setBuildingInfo(building);
      return;
    }
    
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
        
        addNotification(`built a ${selectedBuilding.name} (+${selectedBuilding.happiness}% happiness)`, 'success');
        setSelectedBuilding(null);
        updateAvailableHouses();
      } else {
        addNotification('not enough coins', 'error');
      }
    } 
    else if (!selectedBuilding && grid[index] !== null) {
      setSelectedTile(index);
      setBuildingInfo(grid[index]);
    } 
    else {
      setSelectedTile(null);
      setBuildingInfo(null);
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
        setHappiness(Math.max(0, happiness - 15)); 
        addNotification(`${occupantNeighbor.name} was evicted! Neighborhood happiness decreased.`, 'warning');
      }
    }
    
    const newGrid = [...grid];
    newGrid[index] = null;
    
    setGrid(newGrid);
    setCoins(coins + Math.floor(buildingToDelete.cost * 0.5));
    setHappiness(Math.max(0, happiness - Math.floor(buildingToDelete.happiness * 0.7)));
    
    addNotification(`demolished a ${buildingToDelete.name} (-${Math.floor(buildingToDelete.happiness * 0.7)}% happiness)`, 'info');
    setSelectedTile(null);
    setBuildingInfo(null);
    calculateTotalEnergyUsage();
    updateAvailableHouses();
  };
  
  const handleExpandPlot = (newSize: number, cost: number) => {
    if (coins < cost) {
      addNotification('not enough coins to expand', 'error');
      return;
    }
    
    setCoins(coins - cost);
    setGridSize(newSize);
    addExperience(30);
    setHappiness(Math.min(100, happiness + 5));
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

    if (Math.random() < 0.25) {
      setRandomWeather();
    }
    
    const eventProbability = Math.min(0.7, RANDOM_EVENT_BASE_CHANCE + (day * 0.01));
    const daysSinceLastEvent = day - randomEventDay;
    const eventDayFactor = Math.min(1, daysSinceLastEvent * 0.1);
    const happinessFactor = happiness < 50 ? 0.2 : -0.1;
    const finalProbability = eventProbability * eventDayFactor + happinessFactor;
    
    const todayScheduledEvent = events.find(e => e.dayTrigger === day + 1);
    
    if (!todayScheduledEvent && Math.random() < finalProbability) {
      const randomEvent = getRandomEvent(day + 1);
      if (randomEvent) {
        if (!randomEvent.timeOfDay || randomEvent.timeOfDay === timeOfDay) {
          setCurrentEvent(randomEvent);
          setModalOpen(true);
          setRandomEventDay(day + 1);
        }
      }
    }
    
    const newHappiness = Math.max(0, happiness - HAPPINESS_DECAY_RATE);
    setHappiness(newHappiness);
    
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
    if (!neighbor.hasHome) {
      setSelectedNeighborForHousing(neighbor);
    } else {
      setShowNeighborInfo(neighbor);
    }
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
  
  const checkAchievements = () => {
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
  };
  
  const checkNeighborUnlocks = () => {
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
  };
  
  const hasUnpaidDueBills = () => {
    return bills.some(bill => !bill.isPaid && bill.dayDue <= day);
  };
  
  const toggleTimePause = () => {
    setTimePaused(!timePaused);
  };
  
  const getWeatherIcon = () => {
    switch(weather) {
      case 'sunny': return '☀️';
      case 'rainy': return '🌧️';
      case 'cloudy': return '☁️';
      case 'stormy': return '⛈️';
    }
  };
  
  const getFormattedTime = () => {
    const hours = gameTime % 12 || 12;
    const minutes = gameMinutes.toString().padStart(2, '0');
    const ampm = gameTime >= 12 ? 'pm' : 'am';
    return `${hours}:${minutes} ${ampm}`;
  };
  
  const getTimeOfDayColor = () => {
    switch(timeOfDay) {
      case 'morning': return 'from-amber-500 to-amber-600';
      case 'day': return 'from-emerald-600 to-teal-700';
      case 'evening': return 'from-orange-500 to-red-600';
      case 'night': return 'from-indigo-800 to-purple-900';
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-emerald-700 to-teal-600 text-white">
        <BackgroundBubbles />
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-medium mb-6 lowercase tracking-tight text-center z-10"
        >
          <div className="text-7xl mb-4">🏙️</div>
          <div>neighborville</div>
        </motion.div>
        <div className="flex space-x-3 justify-center">
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
          className="mt-4 text-sm lowercase text-center"
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
      
      <header className={`text-white p-3 shadow-lg transition-colors duration-700 bg-gradient-to-r ${getTimeOfDayColor()}`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🏙️</span>
            <h1 className="text-2xl font-medium lowercase tracking-tight">neighborville</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center rounded-full bg-black bg-opacity-20 px-3 py-1.5"
              onClick={() => setShowHappinessAnalytics(true)}
              style={{ cursor: 'pointer' }}
            >
              <span className="mr-2 text-xl">😊</span>
              <div className="w-16 h-3 bg-black bg-opacity-30 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full"
                  style={{ 
                    width: `${happiness}%`,
                    background: `linear-gradient(90deg, #f87171, #fbbf24, #34d399)` 
                  }}
                ></div>
              </div>
              <span className="ml-2 font-medium lowercase text-base">{happiness}%</span>
            </div>
            
            <div className="flex items-center rounded-full bg-black bg-opacity-20 px-3 py-1.5">
              <span className="mr-2 text-xl">💰</span>
              <span className="font-medium lowercase text-base">{coins}</span>
            </div>
            
            <div className="flex items-center bg-black bg-opacity-20 px-3 py-1.5 rounded-full">
              <Calendar size={18} className="mr-2" />
              <span className="font-medium lowercase text-base">day {day}</span>
            </div>
            
            <div className="flex items-center bg-black bg-opacity-20 px-3 py-1.5 rounded-full">
              <Clock size={18} className="mr-2" />
              <span className="font-medium lowercase text-base">{getFormattedTime()}</span>
              <button 
                className="ml-2 p-0.5 bg-black bg-opacity-20 rounded-full"
                onClick={toggleTimePause}
              >
                {timePaused ? 
                  <Play size={14} className="text-white" /> : 
                  <Pause size={14} className="text-white" />
                }
              </button>
            </div>
            
            <div className="flex items-center bg-black bg-opacity-20 px-3 py-1.5 rounded-full">
              <span className="mr-2 text-xl">{getWeatherIcon()}</span>
              <span className="font-medium lowercase text-base capitalize">{weather}</span>
            </div>
          </div>
        </div>
      </header>
      
      <div className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-emerald-50 rounded-lg shadow-sm px-3 py-1.5 mr-3 flex items-center">
              <User size={16} className="text-emerald-700 mr-2" />
              <span className="text-emerald-800 font-medium mr-2 text-sm lowercase">{playerName} • level {level}</span>
              <ProgressBar 
                value={experience} 
                maxValue={level * 100} 
                width={80}
                color="#10b981"
                bgColor="#e2e8f0"
                showText
                textPosition="inside"
              />
            </div>
            
            <div
              className="bg-emerald-50 rounded-lg shadow-sm p-1.5 mr-3 flex items-center justify-center cursor-pointer"
              onClick={() => setShowAchievements(true)}
            >
              <Award size={16} className="text-emerald-700 mr-1" />
              <span className="text-emerald-800 text-sm lowercase">
                {achievements.filter(a => a.completed).length}/{achievements.length}
              </span>
            </div>
            
            {hasUnpaidDueBills() && (
              <div
                className="bg-red-100 rounded-lg shadow-sm p-1.5 flex items-center justify-center"
              >
                <AlertCircle size={16} className="text-red-600 mr-1" />
                <span className="text-red-600 text-sm lowercase">
                  unpaid bills
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-lg flex items-center gap-2 hover:bg-emerald-200 transition-colors"
              onClick={handleEndDay}
            >
              <Calendar size={16} />
              <span className="font-medium lowercase">end day</span>
            </button>
            
            <button
              className="bg-gray-100 text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto grid grid-cols-12 gap-4 p-4">
        <div className="col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-xl overflow-hidden shadow-md">
            <div className="grid grid-cols-3 gap-1 p-1">
              <button 
                onClick={() => setActiveTab('buildings')}
                className={`py-2 px-3 rounded-lg text-sm font-medium lowercase flex items-center justify-center gap-1 transition-colors ${
                  activeTab === 'buildings' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home size={16} />
                <span>Buildings</span>
              </button>
              <button 
                onClick={() => setActiveTab('utilities')}
                className={`py-2 px-3 rounded-lg text-sm font-medium lowercase flex items-center justify-center gap-1 transition-colors ${
                  activeTab === 'utilities' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Zap size={16} />
                <span>Utilities</span>
              </button>
              <button 
                onClick={() => setActiveTab('neighbors')}
                className={`py-2 px-3 rounded-lg text-sm font-medium lowercase flex items-center justify-center gap-1 transition-colors ${
                  activeTab === 'neighbors' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <User size={16} />
                <span>Neighbors</span>
              </button>
            </div>
          </div>
          
          {activeTab === 'buildings' && (
            <div className="bg-white rounded-xl shadow-md p-4">
              <h2 className="font-medium mb-3 lowercase text-emerald-800">available buildings</h2>
              <div className="grid grid-cols-2 gap-2">
                {buildings.map((building) => (
                  <div key={building.id} className="relative">
                    <BuildingOption 
                      building={building}
                      isSelected={selectedBuilding?.id === building.id}
                      onSelect={handleBuildingSelect}
                    />
                    {!building.unlocked && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-xl flex items-center justify-center">
                        <div className="bg-black bg-opacity-70 px-2 py-1 rounded-lg flex items-center text-white text-xs">
                          <Lock size={12} className="mr-1" />
                          <span>Level {building.levelRequired}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {buildingInfo && !buildingInfo.unlocked && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-700 flex items-center gap-1 mb-1">
                    <Info size={14} />
                    <span>{buildingInfo.name}</span>
                  </h3>
                  <div className="text-xs text-blue-600">
                    <div className="mt-1">Unlocks at level {buildingInfo.levelRequired}</div>
                    <div className="mt-1">Cost: {buildingInfo.cost} coins</div>
                    <div className="mt-1">Happiness: +{buildingInfo.happiness}</div>
                    <div className="mt-1">Income: {buildingInfo.income} coins/day</div>
                  </div>
                  <button 
                    className="mt-2 w-full py-1.5 bg-blue-500 text-white text-xs rounded-lg"
                    onClick={() => setBuildingInfo(null)}
                  >
                    Close
                  </button>
                </div>
              )}
              
              {buildingInfo && buildingInfo.unlocked && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                  <h3 className="text-sm font-medium text-emerald-700 flex items-center gap-1 mb-1">
                    <Info size={14} />
                    <span>{buildingInfo.name}</span>
                  </h3>
                  <div className="text-xs text-emerald-600">
                    <div className="mt-1">Cost: {buildingInfo.cost} coins</div>
                    <div className="mt-1">Happiness: +{buildingInfo.happiness}</div>
                    <div className="mt-1">Income: {buildingInfo.income} coins/day</div>
                    <div className="mt-1">Energy: {buildingInfo.energyUsage && buildingInfo.energyUsage > 0 ? '+' : ''}{buildingInfo.energyUsage} units</div>
                    
                    {(buildingInfo.id === 'house' || buildingInfo.id === 'apartment') && (
                      <div className="mt-1">
                        {buildingInfo.isOccupied ? 
                          <div className="flex items-center text-emerald-600">
                            <Check size={12} className="mr-1" />
                            <span>Occupied</span>
                          </div> : 
                          <div className="flex items-center text-amber-600">
                            <AlertCircle size={12} className="mr-1" />
                            <span>Vacant</span>
                          </div>
                        }
                      </div>
                    )}
                  </div>
                  <button 
                    className="mt-2 w-full py-1.5 bg-emerald-500 text-white text-xs rounded-lg"
                    onClick={() => setBuildingInfo(null)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'utilities' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                      <Zap size={16} />
                    </div>
                    <div>
                      <h3 className="font-medium lowercase text-gray-800">energy usage</h3>
                      <div className="text-xs text-gray-500 lowercase flex items-center">
                        <span>{totalEnergyUsage} units</span>
                        <span className="mx-1">•</span>
                        <span>{totalEnergyUsage * energyRate} coins{daysUntilBill > 0 ? ` in ${daysUntilBill} days` : ' today'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${totalEnergyUsage > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, totalEnergyUsage)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0 units</span>
                    <span>100 units</span>
                  </div>
                </div>
                
                {totalEnergyUsage > 100 && (
                  <div className="mt-3 p-2 bg-red-50 rounded-lg text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} />
                    <span>High energy usage! Consider adding solar panels.</span>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mr-3">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h3 className="font-medium lowercase text-gray-800">bills</h3>
                      <div className="text-xs text-gray-500 lowercase">
                        {bills.filter(b => !b.isPaid).length} unpaid • {bills.filter(b => b.isPaid).length} paid
                      </div>
                    </div>
                  </div>
                </div>
                
                {bills.filter(b => !b.isPaid).length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {bills.filter(b => !b.isPaid).map(bill => (
                      <div key={bill.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-2">
                            <Zap size={14} />
                          </div>
                          <div>
                            <div className="text-sm text-gray-700 lowercase">{bill.name}</div>
                            <div className="text-xs text-gray-500">due on day {bill.dayDue} (today is day {day})</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-700">{bill.amount} coins</div>
                          <button
                            onClick={() => handlePayBill(bill.id)}
                            disabled={coins < bill.amount}
                            className={`px-2 py-1 rounded-md text-xs ${
                              coins >= bill.amount
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {coins >= bill.amount ? 'Pay' : 'Not enough'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 rounded-lg text-center text-emerald-600 lowercase">
                    no unpaid bills at the moment
                  </div>
                )}
                
                <div className="mt-3 text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
                  <p>Energy bill: {totalEnergyUsage * energyRate} coins (due in {daysUntilBill} days)</p>
                  <p>Energy rate: {energyRate} coins per unit</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3">
                      <Plus size={16} />
                    </div>
                    <div>
                      <h3 className="font-medium lowercase text-gray-800">expand your plot</h3>
                      <div className="text-xs text-gray-500 lowercase">
                        current size: {Math.sqrt(gridSize)}×{Math.sqrt(gridSize)}
                      </div>
                    </div>
                  </div>
                </div>
                
                {gridSize < 64 ? (
                  <div className="mt-2">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                      <div 
                        className="h-full bg-purple-500"
                        style={{ width: `${(gridSize / 64) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-700 lowercase">next expansion</div>
                          <div className="text-xs text-gray-500">
                            {Math.sqrt(gridSize)}×{Math.sqrt(gridSize)} → {Math.sqrt(gridSize) + 1}×{Math.sqrt(gridSize) + 1}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-purple-600 lowercase">
                            {gridSize === 16 ? 1500 : 
                             gridSize === 25 ? 3000 :
                             gridSize === 36 ? 5000 : 
                             gridSize === 49 ? 8000 : 0} coins
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleExpandPlot(
                        gridSize === 16 ? 25 : 
                        gridSize === 25 ? 36 :
                        gridSize === 36 ? 49 : 
                        gridSize === 49 ? 64 : gridSize,
                        gridSize === 16 ? 1500 : 
                        gridSize === 25 ? 3000 :
                        gridSize === 36 ? 5000 : 
                        gridSize === 49 ? 8000 : 0
                      )}
                      disabled={coins < (
                        gridSize === 16 ? 1500 : 
                        gridSize === 25 ? 3000 :
                        gridSize === 36 ? 5000 : 
                        gridSize === 49 ? 8000 : Infinity
                      )}
                      className={`w-full py-2 rounded-lg text-white text-sm font-medium lowercase ${
                        coins < (
                          gridSize === 16 ? 1500 : 
                          gridSize === 25 ? 3000 :
                          gridSize === 36 ? 5000 : 
                          gridSize === 49 ? 8000 : Infinity
                        ) ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                      }`}
                    >
                      purchase expansion
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 rounded-lg text-center text-green-600 lowercase">
                    you've reached the maximum plot size!
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'neighbors' && (
            <>
              {selectedNeighborForHousing ? (
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium lowercase text-emerald-800">assign home to {selectedNeighborForHousing.name}</h3>
                    <button
                      onClick={() => setSelectedNeighborForHousing(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center p-3 bg-emerald-50 rounded-lg mb-4">
                    <div className="text-4xl mr-3">{selectedNeighborForHousing.avatar}</div>
                    <div>
                      <div className="font-medium text-emerald-700">{selectedNeighborForHousing.name}</div>
                      <div className="text-sm text-emerald-600">Rent: {selectedNeighborForHousing.dailyRent} coins/day</div>
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-700 mb-2 lowercase">select a house</h4>
                  
                  {availableHouses.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableHouses.map(house => (
                        <button
                          key={house.index}
                          onClick={() => handleAssignResident(selectedNeighborForHousing.id, house.index)}
                          className="p-3 bg-white border border-gray-200 rounded-lg flex flex-col items-center hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                        >
                          <div 
                            className="w-10 h-10 rounded-full mb-2 flex items-center justify-center text-white"
                            style={{ backgroundColor: house.building.color }}
                          >
                            <Home size={18} />
                          </div>
                          <div className="text-sm font-medium text-gray-700">{house.building.name}</div>
                          <div className="text-xs text-gray-500">Plot #{house.index}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-yellow-50 rounded-lg text-center">
                      <p className="text-yellow-700 text-sm">No available houses</p>
                      <p className="text-yellow-600 text-xs mt-1">Build houses or apartments first!</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setSelectedNeighborForHousing(null)}
                    className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-md p-4">
                    <h3 className="font-medium mb-3 lowercase text-emerald-800">your neighbors</h3>
                    <div className="space-y-2">
                      {neighbors.filter(n => n.unlocked && !n.hasHome).length > 0 && (
                        <div>
                          <h4 className="font-medium text-amber-600 text-sm mb-2 lowercase">neighbors needing homes</h4>
                          <div className="space-y-2 mb-4">
                            {neighbors.filter(n => n.unlocked && !n.hasHome).map(neighbor => (
                              <div
                                key={neighbor.id}
                                onClick={() => setSelectedNeighborForHousing(neighbor)}
                                className="p-2 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
                              >
                                <div className="flex items-center">
                                  <div className="text-2xl mr-3">{neighbor.avatar}</div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-700">{neighbor.name}</div>
                                    <div className="text-xs text-amber-600">Rent: {neighbor.dailyRent} coins/day</div>
                                  </div>
                                </div>
                                <div className="text-xs bg-white px-2 py-1 rounded-lg text-amber-600">
                                  Assign Home
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {neighbors.filter(n => n.unlocked && n.hasHome).length > 0 && (
                        <div>
                          <h4 className="font-medium text-emerald-700 text-sm mb-2 lowercase">housed neighbors</h4>
                          <div className="space-y-2">
                            {neighbors.filter(n => n.unlocked && n.hasHome).map(neighbor => {
                              const house = neighbor.houseIndex !== undefined ? grid[neighbor.houseIndex] : null;
                              return (
                                <div 
                                  key={neighbor.id}
                                  onClick={() => setShowNeighborInfo(neighbor)}
                                  className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between cursor-pointer hover:bg-emerald-100 transition-colors"
                                >
                                  <div className="flex items-center">
                                    <div className="text-2xl mr-3">{neighbor.avatar}</div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-700">{neighbor.name}</div>
                                      <div className="text-xs text-emerald-600">Pays {neighbor.dailyRent} coins/day</div>
                                    </div>
                                  </div>
                                  <div
                                    className="flex items-center bg-white px-2 py-1 rounded-lg text-xs"
                                    style={{ color: house?.color }}
                                  >
                                    <div
                                      className="w-4 h-4 rounded-full mr-1 flex items-center justify-center text-white"
                                      style={{ backgroundColor: house?.color }}
                                    >
                                      <Home size={10} />
                                    </div>
                                    <span>#{neighbor.houseIndex}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {neighbors.filter(n => !n.unlocked).length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-600 text-sm mb-2 lowercase">locked neighbors</h4>
                          <div className="space-y-2">
                            {neighbors.filter(n => !n.unlocked).map(neighbor => (
                              <div
                                key={neighbor.id}
                                className="p-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                              >
                                <div className="flex items-center">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                    <Lock size={16} className="text-gray-500" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-500">Locked Neighbor</div>
                                    <div className="text-xs text-gray-400">
                                      {neighbor.unlockCondition?.description}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="col-span-9">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium lowercase text-gray-800">your neighborhood</h2>
              <div className="text-sm text-gray-500">click to place buildings</div>
            </div>
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
              
              {showNeighborInfo.hasHome && showNeighborInfo.houseIndex !== undefined && (
                <div className="mb-4">
                  <div className="font-medium mb-2 lowercase text-emerald-700">current residence</div>
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white mr-3"
                        style={{ backgroundColor: grid[showNeighborInfo.houseIndex]?.color }}
                      >
                        <Home size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-emerald-700">
                          {grid[showNeighborInfo.houseIndex]?.name}
                        </div>
                        <div className="text-xs text-emerald-600">
                          Plot #{showNeighborInfo.houseIndex}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowNeighborInfo(null)}
                  className="bg-gray-100 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors lowercase"
                >
                  close
                </button>
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
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
                  <BarChart size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-medium lowercase text-emerald-800">happiness analytics</h2>
                  <div className="text-sm text-gray-500">current happiness: {happiness}%</div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${happiness}%` }}
                    transition={{ duration: 1 }}
                    className="h-full"
                    style={{ 
                      background: `linear-gradient(to right, #f87171, #fbbf24, #34d399)` 
                    }}
                  ></motion.div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <div>unhappy</div>
                  <div>neutral</div>
                  <div>happy</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-emerald-700 mb-2 lowercase">buildings impact</h3>
                  <div className="space-y-2">
                    {grid.filter(b => b !== null).reduce((acc, building) => {
                      if (!building) return acc;
                      const existing = acc.find(b => b.id === building.id);
                      if (existing) {
                        existing.count++;
                        existing.happiness += building.happiness;
                      } else {
                        acc.push({
                          id: building.id,
                          name: building.name,
                          count: 1,
                          happiness: building.happiness
                        });
                      }
                      return acc;
                    }, [] as Array<{id: string, name: string, count: number, happiness: number}>)
                    .sort((a, b) => b.happiness - a.happiness)
                    .map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div className="text-sm text-gray-700 lowercase">{item.count} × {item.name}</div>
                        <div className="text-sm font-medium text-emerald-600">+{item.happiness}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {neighbors.filter(n => n.unlocked).length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-emerald-700 mb-2 lowercase">neighbors impact</h3>
                    <div className="space-y-2">
                      {neighbors.filter(n => n.unlocked && n.hasHome).map(neighbor => (
                        <div key={neighbor.id} className="flex justify-between items-center">
                          <div className="text-sm text-gray-700 lowercase flex items-center">
                            <span className="mr-2">{neighbor.avatar}</span>
                            <span>{neighbor.name}</span>
                          </div>
                          <div className="text-sm font-medium text-emerald-600">+5</div>
                        </div>
                      ))}
                      {neighbors.filter(n => n.unlocked && !n.hasHome).map(neighbor => (
                        <div key={neighbor.id} className="flex justify-between items-center">
                          <div className="text-sm text-gray-700 lowercase flex items-center">
                            <span className="mr-2">{neighbor.avatar}</span>
                            <span>{neighbor.name} (needs home)</span>
                          </div>
                          <div className="text-sm font-medium text-amber-600">+0</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-emerald-700 mb-2 lowercase">weather impact</h3>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700 lowercase flex items-center">
                      <span className="mr-2">{getWeatherIcon()}</span>
                      <span>{weather} weather</span>
                    </div>
                    <div className={`text-sm font-medium ${weatherHappinessEffect > 0 ? 'text-emerald-600' : weatherHappinessEffect < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {weatherHappinessEffect > 0 ? '+' : ''}{weatherHappinessEffect}
                    </div>
                  </div>
                </div>
                
                {recentEvents.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-emerald-700 mb-2 lowercase">recent events impact</h3>
                    <div className="space-y-2">
                      {recentEvents.map((event, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="text-sm text-gray-700 lowercase">
                            {event.name} (day {event.day})
                          </div>
                          <div className={`text-sm font-medium ${event.happinessImpact > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {event.happinessImpact > 0 ? '+' : ''}{event.happinessImpact}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {bills.filter(bill => !bill.isPaid && bill.dayDue <= day).length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-red-600 mb-2 lowercase">unpaid bills penalty</h3>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-700 lowercase">
                        {bills.filter(bill => !bill.isPaid && bill.dayDue <= day).length} unpaid bills
                      </div>
                      <div className="text-sm font-medium text-red-600">
                        -{bills.filter(bill => !bill.isPaid && bill.dayDue <= day).length * 8}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowHappinessAnalytics(false)}
                  className="bg-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-600 transition-colors lowercase"
                >
                  close
                </button>
              </div>
            </motion.div>
          </motion.div>
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
                <button
                  onClick={() => setShowAchievements(false)}
                  className="bg-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-600 transition-colors lowercase"
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
      
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 20 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-medium mb-4 lowercase text-emerald-800">game settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-gray-700">Auto-save</div>
                  <div className="relative inline-block w-12 h-6">
                    <input 
                      type="checkbox" 
                      className="opacity-0 w-0 h-0" 
                      checked={autoSaveEnabled}
                      onChange={() => setAutoSaveEnabled(!autoSaveEnabled)}
                    />
                    <div
                      className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors ${
                        autoSaveEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <div 
                        className={`absolute w-4 h-4 bg-white rounded-full transition-transform ${
                          autoSaveEnabled ? 'transform translate-x-7' : 'transform translate-x-1'
                        } top-1`}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-700 mb-2">Game difficulty</div>
                  <div className="flex items-center space-x-2">
                    <button className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm">
                      Normal
                    </button>
                    <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
                      Hard
                    </button>
                    <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
                      Sandbox
                    </button>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <button 
                    className="bg-emerald-500 text-white py-2 px-4 rounded-lg w-full"
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowSaveManager(true);
                    }}
                  >
                    Save Game
                  </button>
                </div>
                
                <div>
                  <button
                    className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg w-full"
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowTutorial(true);
                    }}
                  >
                    Show Tutorial
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-right">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="bg-gray-100 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors lowercase"
                >
                  close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
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
    </div>
  );
}