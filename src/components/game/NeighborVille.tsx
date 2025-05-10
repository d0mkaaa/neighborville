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
import BillsPanel from "./BillsPanel";
import TutorialGuide from "./TutorialGuide";
import EventModal from "./EventModal";
import NeighborUnlockModal from "./NeighborUnlockModal";
import NeighborListModal from "./NeighborListModal";
import AchievementsModal from "./AchievementsModal";
import AchievementUnlockModal from "./AchievementUnlockModal";
import BuildingInfoModal from "./BuildingInfoModal";
import CalendarView from "./CalendarView";
import { buildings as initialBuildings } from "../../data/buildings";
import { neighborProfiles } from "../../data/neighbors";
import { ACHIEVEMENTS } from "../../data/achievements";
import { possibleEvents, getRandomEvent } from "../../data/events";
import type { 
  Building, GameEvent, Neighbor, ScheduledEvent,
  GameProgress, Achievement, RecentEvent, Bill, TimeOfDay, EventOption
} from "../../types/game";
import type { ExtendedNotification } from "./NotificationSystem";

interface NeighborVilleProps {
  initialGameState?: GameProgress | null;
}

type DayRecord = {
  day: number;
  coins: number;
  happiness: number;
  residents: number;
  buildings: number;
  income: number;
  expenses: number;
  events: { name: string; type: 'good' | 'bad' | 'neutral' }[];
};

export default function NeighborVille({ initialGameState }: NeighborVilleProps) {
  const [playerName, setPlayerName] = useState("");
  const [coins, setCoins] = useState(1000);
  const [happiness, setHappiness] = useState(50); 
  const [day, setDay] = useState(1);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [gridSize, setGridSize] = useState<number>(16); 
  const [grid, setGrid] = useState<(Building | null)[]>(Array(64).fill(null)); 
  
  const [gameTime, setGameTime] = useState<number>(8);
  const [gameMinutes, setGameMinutes] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
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
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [showNeighborUnlock, setShowNeighborUnlock] = useState<Neighbor | null>(null);
  const [showNeighborList, setShowNeighborList] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showAchievementUnlock, setShowAchievementUnlock] = useState<Achievement | null>(null);
  const [showBuildingInfo, setShowBuildingInfo] = useState<{building: Building, index: number} | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  
  const [weather, setWeather] = useState<'sunny' | 'rainy' | 'cloudy' | 'stormy'>('sunny');
  const [weatherForecast, setWeatherForecast] = useState<string[]>([]);
  const [showWeatherForecast, setShowWeatherForecast] = useState(false);
  const [totalEnergyUsage, setTotalEnergyUsage] = useState<number>(0);
  const [energyRate, setEnergyRate] = useState<number>(2);
  const [lastBillDay, setLastBillDay] = useState<number>(0);
  const [daysUntilBill, setDaysUntilBill] = useState<number>(5);
  const [hourlyCoinBonus, setHourlyCoinBonus] = useState<number>(0);
  const [happinessDecay, setHappinessDecay] = useState<number>(0.5);

  useEffect(() => {
    if (initialGameState) {
      loadGameState(initialGameState);
    } else {
      initializeNewGame();
      setShowTutorial(true);
    }
  }, [initialGameState]);

  useEffect(() => {
    if (!timePaused) {
      const timer = setInterval(() => {
        setGameMinutes(prevMinutes => {
          if (prevMinutes >= 59) {
            setGameTime(prevTime => {
              const newTime = (prevTime + 1) % 24;
              updateTimeOfDay(newTime);
              handleHourlyEffects(newTime);
              
              if (newTime === 6) {
                handleEndDay();
              }
              
              return newTime;
            });
            return 0;
          }
          return prevMinutes + 1;
        });
      }, 300);

      return () => clearInterval(timer);
    }
  }, [timePaused]);

  useEffect(() => {
    generateWeatherForecast();
  }, [day, gameTime]);

  const updateTimeOfDay = (time: number) => {
    let newTimeOfDay: TimeOfDay;
    
    if (time >= 5 && time < 10) {
      newTimeOfDay = 'morning';
    } else if (time >= 10 && time < 17) {
      newTimeOfDay = 'day';
    } else if (time >= 17 && time < 21) {
      newTimeOfDay = 'evening';
    } else {
      newTimeOfDay = 'night';
    }
    
    setTimeOfDay(newTimeOfDay);
    updateWeather(newTimeOfDay);
  };

  const generateWeatherForecast = () => {
    const forecast = [];
    for (let i = 0; i < 6; i++) {
      const hour = (gameTime + i * 4) % 24;
      const weatherTypes = ['sunny', 'cloudy', 'rainy', 'stormy'];
      
      let weights;
      if (hour < 6 || hour >= 22) {
        // Night - mostly clear
        weights = [0.7, 0.2, 0.08, 0.02];
      } else if (hour >= 6 && hour < 10) {
        // Morning - some fog/clouds
        weights = [0.4, 0.4, 0.15, 0.05];
      } else if (hour >= 10 && hour < 17) {
        // Day - mostly sunny
        weights = [0.6, 0.25, 0.12, 0.03];
      } else {
        // Evening - can be stormy
        weights = [0.3, 0.3, 0.25, 0.15];
      }
      
      const rand = Math.random();
      let cumulative = 0;
      for (let j = 0; j < weights.length; j++) {
        cumulative += weights[j];
        if (rand < cumulative) {
          forecast.push(weatherTypes[j]);
          break;
        }
      }
    }
    setWeatherForecast(forecast);
  };

  const updateWeather = (timeOfDay: TimeOfDay) => {
    if (weatherForecast.length > 0) {
      setWeather(weatherForecast[0] as any);
    }
  };

  const handleHourlyEffects = (newTime: number) => {
    let hourlyCoinIncome = 0;
    grid.forEach(building => {
      if (building && building.income > 0) {
        let income = building.income / 24;
        
        if (building.id === 'cafe' && newTime >= 6 && newTime <= 11) {
          income *= 1.5; // Morning rush
        }
        if (building.id === 'music_venue' && newTime >= 19 && newTime <= 2) {
          income *= 2.0; // Evening concerts
        }
        if (building.id === 'solar_panel' && newTime >= 9 && newTime <= 17) {
          income *= 1.5; // Peak sun hours
        }
        
        hourlyCoinIncome += income;
      }
    });
    
    if (hourlyCoinIncome > 0) {
      setCoins(coins => coins + Math.round(hourlyCoinIncome));
      setHourlyCoinBonus(Math.round(hourlyCoinIncome));
      setTimeout(() => setHourlyCoinBonus(0), 2000);
    }
    
    const totalResidents = neighbors.filter(n => n.hasHome).length;
    const happinessLoss = happinessDecay + (totalResidents * 0.1);
    setHappiness(prev => Math.max(0, prev - happinessLoss));
    
    if (Math.random() < 0.05) { 
      const event = getRandomEvent(day);
      if (event && (event.timeOfDay === timeOfDay || !event.timeOfDay)) {
        setCurrentEvent(event);
      }
    }
  };

  const initializeNewGame = () => {
    const name = initialGameState?.playerName || "Mayor";
    setPlayerName(name);
    setCoins(1000);
    setHappiness(50);
    setDay(1);
    setLevel(1);
    setExperience(0);
    setGridSize(16);
    setGrid(Array(64).fill(null));
    setWeather('sunny');
    setGameTime(8);
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
    setGameTime(state.gameTime || 8);
    setGameMinutes(state.gameMinutes || 0);
    setTimeOfDay(state.timeOfDay || 'morning');
    setBills(state.bills || []);
    setTotalEnergyUsage(state.totalEnergyUsage || 0);
    setEnergyRate(state.energyRate || 2);
    setLastBillDay(state.lastBillDay || 0);
    setRecentEvents(state.recentEvents || []);
    updateTimeOfDay(state.gameTime || 8);
    
    const currentLevel = state.level || 1;
    const unlockedBuildings = initialBuildings.map(building => ({
      ...building,
      unlocked: building.levelRequired ? currentLevel >= building.levelRequired : true
    }));
    setBuildings(unlockedBuildings);
    
    const loadedNeighbors = neighborProfiles.map(neighbor => {
      const savedNeighbor = state.neighbors.find(n => n.id === neighbor.id);
      return savedNeighbor || neighbor;
    });
    setNeighbors(loadedNeighbors);
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

  const handleBuildingManage = (building: Building, index: number) => {
    setShowBuildingInfo({building, index});
  };

  const handleDeleteBuilding = (index: number) => {
    if (index >= gridSize) return;
    
    const buildingToDelete = grid[index];
    if (!buildingToDelete) return;
    
    if (buildingToDelete.occupants) {
      buildingToDelete.occupants.forEach(occupantId => {
        handleRemoveResident(occupantId);
      });
    }
    
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
        let income = building.income;
        
        if (building.occupants && building.occupants.length > 0) {
          building.occupants.forEach(occupantId => {
            const occupant = neighbors.find(n => n.id === occupantId);
            if (occupant) {
              income += occupant.dailyRent || 0;
            }
          });
        }
        
        return total + income;
      }
      return total;
    }, 0);
    
    const energyCost = totalEnergyUsage > 0 ? Math.round(totalEnergyUsage * energyRate) : 0;
    const netIncome = baseIncome - energyCost;
    
    const newRecord: DayRecord = {
      day: day,
      coins: coins,
      happiness: happiness,
      residents: neighbors.filter(n => n.hasHome).length,
      buildings: grid.filter(b => b !== null).length,
      income: baseIncome,
      expenses: energyCost,
      events: recentEvents.filter(e => e.day === day).map(e => ({
        name: e.name,
        type: e.happinessImpact > 0 ? 'good' : e.happinessImpact < 0 ? 'bad' : 'neutral'
      }))
    };
    
    setDayRecords([...dayRecords, newRecord]);
    setCoins(coins + netIncome);
    setDay(day + 1);
    
    const newDaysUntilBill = daysUntilBill - 1;
    setDaysUntilBill(newDaysUntilBill);
    
    if (newDaysUntilBill <= 0) {
      generateEnergyBill();
      setDaysUntilBill(5);
      setLastBillDay(day + 1);
    }
    
    checkForRandomEvent();
    updateNeighborHappiness();
    checkAchievements();
    
    addNotification(`Day ${day} complete! Earned ${netIncome} coins (${baseIncome} income - ${energyCost} energy cost)`, 'success');
    saveGame();
  };

  const checkForRandomEvent = () => {
    if (Math.random() < 0.3) {
      const event = getRandomEvent(day);
      if (event) {
        setCurrentEvent(event);
      }
    }
  };

  const handleEventOption = (option: EventOption) => {
    if (!currentEvent) return;
    
    setCoins(coins + option.coins);
    setHappiness(Math.min(100, Math.max(0, happiness + option.happiness)));
    
    const newEvent: RecentEvent = {
      id: currentEvent.id,
      name: currentEvent.title,
      happinessImpact: option.happiness,
      coinImpact: option.coins,
      day: day
    };
    
    setRecentEvents([...recentEvents, newEvent].slice(-5));
    
    if (option.neighborEffects) {
      const updatedNeighbors = neighbors.map(neighbor => {
        const effect = option.neighborEffects?.find(e => 
          e.neighborId === undefined || e.neighborId === neighbor.id
        );
        
        if (effect) {
          const newHappiness = Math.min(100, Math.max(0, (neighbor.happiness || 70) + effect.happinessChange));
          return {
            ...neighbor,
            happiness: newHappiness
          };
        }
        
        return neighbor;
      });
      
      setNeighbors(updatedNeighbors);
    }
    
    setCurrentEvent(null);
    addNotification(option.outcome, option.happiness > 0 ? 'success' : 'warning');
  };

  const updateNeighborHappiness = () => {
    const updatedNeighbors = neighbors.map(neighbor => {
      if (!neighbor.unlocked || !neighbor.hasHome) return neighbor;
      
      let happinessChange = 0;
      
      const house = neighbor.houseIndex !== undefined ? grid[neighbor.houseIndex] : null;
      if (house) {
        if (neighbor.housingPreference === 'house' && house.id === 'apartment') {
          happinessChange -= 15;
        } else if (neighbor.housingPreference === 'apartment' && house.id === 'house') {
          happinessChange -= 10;
        }
        
        if (house.occupants && house.occupants.length > (neighbor.maxNeighbors || 1)) {
          happinessChange -= 20;
        }
      }
      
      grid.forEach(building => {
        if (building) {
          if (building.name.toLowerCase() === neighbor.likes.toLowerCase()) {
            happinessChange += 8;
          }
          if (building.name.toLowerCase() === neighbor.dislikes.toLowerCase()) {
            happinessChange -= 12;
          }
        }
      });
      
      const newHappiness = Math.min(100, Math.max(0, (neighbor.happiness || 70) + happinessChange));
      
      return {
        ...neighbor,
        happiness: newHappiness
      };
    });
    
    setNeighbors(updatedNeighbors);
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
      const building = updatedGrid[houseIndex]!;
      const newOccupants = [...(building.occupants || []), neighborId];
      
      updatedGrid[houseIndex] = {
        ...building,
        isOccupied: newOccupants.length > 0,
        occupants: newOccupants
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
    
    if (showBuildingInfo && showBuildingInfo.index === houseIndex) {
      const updatedBuilding = updatedGrid[houseIndex];
      if (updatedBuilding) {
        setShowBuildingInfo({building: updatedBuilding, index: houseIndex});
      }
    }
  };

  const handleRemoveResident = (neighborId: number) => {
    const neighbor = neighbors.find(n => n.id === neighborId);
    if (!neighbor || !neighbor.hasHome || neighbor.houseIndex === undefined) return;
    
    const updatedNeighbors = neighbors.map(n => {
      if (n.id === neighborId) {
        return {
          ...n,
          hasHome: false,
          houseIndex: undefined
        };
      }
      return n;
    });
    
    const updatedGrid = [...grid];
    const house = updatedGrid[neighbor.houseIndex];
    if (house) {
      const newOccupants = (house.occupants || []).filter(id => id !== neighborId);
      updatedGrid[neighbor.houseIndex] = {
        ...house,
        isOccupied: newOccupants.length > 0,
        occupants: newOccupants
      };
    }
    
    setNeighbors(updatedNeighbors);
    setGrid(updatedGrid);
    
    addNotification(`${neighbor.name} moved out`, 'info');
    setHappiness(Math.max(0, happiness - 5));
    
    if (showBuildingInfo && showBuildingInfo.index === neighbor.houseIndex) {
      const updatedBuilding = updatedGrid[neighbor.houseIndex];
      if (updatedBuilding) {
        setShowBuildingInfo({building: updatedBuilding, index: neighbor.houseIndex});
      }
    }
  };

  const handleCollectIncome = (gridIndex: number, amount: number) => {
    setCoins(coins + amount);
    addNotification(`Collected ${amount} coins from your business!`, 'success');
  };

  const checkAchievements = () => {
    const updatedAchievements = achievements.map(achievement => {
      if (achievement.completed) return achievement;
      
      let shouldComplete = false;
      
      switch (achievement.id) {
        case 'first_building':
          shouldComplete = grid.some(building => building !== null);
          break;
        case 'three_buildings':
          const buildingTypes = new Set(grid.filter(b => b !== null).map(b => b!.id));
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
          shouldComplete = neighbors.some(n => n.unlocked && n.unlockCondition !== null);
          break;
        case 'full_grid':
          shouldComplete = grid.slice(0, gridSize).every(tile => tile !== null);
          break;
        case 'level_5':
          shouldComplete = level >= 5;
          break;
        case 'max_expansion':
          shouldComplete = gridSize >= 64;
          break;
      }
      
      if (shouldComplete && !achievement.completed) {
        setExperience(experience + achievement.xpReward);
        addNotification(`Achievement unlocked: ${achievement.title}! (+${achievement.xpReward} XP)`, 'success');
        
        const updatedAchievement = {
          ...achievement,
          completed: true
        };
        
        setShowAchievementUnlock(updatedAchievement);
        return updatedAchievement;
      }
      
      return achievement;
    });
    
    setAchievements(updatedAchievements);
  };

  useEffect(() => {
    if (experience >= level * 100) {
      setLevel(level + 1);
      setExperience(experience - level * 100);
      
      const newUnlockedBuildings = buildings.map(building => ({
        ...building,
        unlocked: building.levelRequired ? level + 1 >= building.levelRequired : building.unlocked
      }));
      setBuildings(newUnlockedBuildings);
      
      const newUnlockedNeighbors = neighbors.map(neighbor => {
        if (!neighbor.unlocked && neighbor.unlockCondition?.type === 'level' && 
            neighbor.unlockCondition.level === level + 1) {
          return {
            ...neighbor,
            unlocked: true
          };
        }
        return neighbor;
      });
      setNeighbors(newUnlockedNeighbors);
      
      addNotification(`Level up! You are now level ${level + 1}`, 'success');
      checkForNewUnlocks();
    }
  }, [experience, level]);

  const checkForNewUnlocks = () => {
    neighborProfiles.forEach(profile => {
      const current = neighbors.find(n => n.id === profile.id);
      
      if (current && !current.unlocked && current.unlockCondition) {
        let shouldUnlock = false;
        
        switch (current.unlockCondition?.type) {
          case 'building':
            const buildingCount = grid.filter(b => b?.id === current.unlockCondition?.buildingId).length;
            shouldUnlock = buildingCount >= (current.unlockCondition?.count || 1);
            break;
          case 'level':
            shouldUnlock = level >= (current.unlockCondition?.level || 1);
            break;
          case 'happiness':
            shouldUnlock = happiness >= (current.unlockCondition?.level || 0);
            break;
          case 'day':
            shouldUnlock = day >= (current.unlockCondition?.day || 0);
            break;
        }
        
        if (shouldUnlock) {
          const updatedNeighbors = neighbors.map(n => 
            n.id === profile.id ? { ...n, unlocked: true } : n
          );
          setNeighbors(updatedNeighbors);
          setShowNeighborUnlock(current);
        }
      }
    });
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
      gameMinutes,
      timeOfDay,
      recentEvents,
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
            weatherForecast={weatherForecast}
            showWeatherForecast={showWeatherForecast}
            onEndDay={() => {}}
            onOpenSaveManager={() => setShowSaveManager(true)}
            onShowSettings={() => setShowSettings(true)}
            onShowTutorial={() => setShowTutorial(true)}
            onShowAchievements={() => setShowAchievements(true)}
            onToggleTimePause={toggleTimePause}
            onTimeChange={handleTimeChange}
            onShowHappinessAnalytics={handleShowHappinessAnalytics}
            onShowCalendar={() => setShowCalendar(true)}
            onToggleWeatherForecast={() => setShowWeatherForecast(!showWeatherForecast)}
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
            
            {hourlyCoinBonus > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -50 }}
                className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg"
              >
                +{hourlyCoinBonus} coins
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
                {['buildings', 'utilities', 'residents'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => {
                      if (tab === 'residents' && activeTab !== 'residents') {
                        setShowNeighborList(true);
                      } else {
                        setActiveTab(tab);
                      }
                    }}
                    className={`py-2 px-3 rounded-lg text-sm font-medium lowercase flex items-center justify-center gap-1 transition-colors ${
                      activeTab === tab ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tab === 'buildings' && <Home size={16} />}
                    {tab === 'utilities' && <Zap size={16} />}
                    {tab === 'residents' && <User size={16} />}
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
                onBuildingManage={handleBuildingManage}
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
          gameMinutes,
          timeOfDay,
          recentEvents,
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
                recentEvents={recentEvents}
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
        {currentEvent && (
          <EventModal 
            event={currentEvent}
            onOptionSelect={handleEventOption}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNeighborUnlock && (
          <NeighborUnlockModal 
            neighbor={showNeighborUnlock}
            onClose={() => setShowNeighborUnlock(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNeighborList && (
          <NeighborListModal 
            neighbors={neighbors}
            onClose={() => setShowNeighborList(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievements && (
          <AchievementsModal 
            achievements={achievements}
            onClose={() => setShowAchievements(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAchievementUnlock && (
          <AchievementUnlockModal 
            achievement={showAchievementUnlock}
            onClose={() => setShowAchievementUnlock(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBuildingInfo && (
          <BuildingInfoModal 
            building={showBuildingInfo.building}
            gridIndex={showBuildingInfo.index}
            neighbors={neighbors}
            onClose={() => setShowBuildingInfo(null)}
            onAssignResident={handleAssignResident}
            onRemoveResident={handleRemoveResident}
            onCollectIncome={handleCollectIncome}
            grid={grid}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCalendar && (
          <CalendarView 
            dayRecords={dayRecords}
            currentDay={day}
            onClose={() => setShowCalendar(false)}
          />
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