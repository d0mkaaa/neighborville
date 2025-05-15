import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Home, Zap, User, Calendar, Settings, Award, AlertCircle, X, CheckCircle, Volume2, VolumeX, TrendingUp, Save } from "lucide-react";
import { getAvailableUpgrades, calculateUpgradedStats } from "../../data/upgrades";
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
import CoinHistory from "./CoinHistory";
import UtilityGrid from "./UtilityGrid";
import PlayerStatsModal from "./PlayerStatsModal";
import MusicControls from "./MusicControls";
import SettingsModal from "./SettingsModal";
import NeighborSocialFeed from "./NeighborSocialFeed";
import Marketplace from "./Marketplace";
import SpecialEvents from "./SpecialEvents";
import BuildingModal from "./BuildingModal";
import Dropdown from "../ui/Dropdown";
import { buildings as initialBuildings } from "../../data/buildings";
import { neighborProfiles } from "../../data/neighbors";
import { ACHIEVEMENTS } from "../../data/achievements";
import { possibleEvents, getRandomEvent } from "../../data/events";
import { cloudSave } from "../../utils/cloudsave";
import { saveGameToServer, shouldSaveGame } from "../../services/gameService";
import type { 
  Building, GameEvent, Neighbor, ScheduledEvent,
  GameProgress, Achievement, RecentEvent, Bill, TimeOfDay, EventOption,
  CoinHistoryEntry, WeatherType, PowerGridState, WaterGridState
} from "../../types/game";
import type { ExtendedNotification } from "./NotificationSystem";
import AuthModal from '../auth/AuthModal';
import PublicProfileModal from '../profile/PublicProfileModal';
import { useAuth } from '../../context/AuthContext';
import Leaderboard from '../profile/Leaderboard';

interface NeighborVilleProps {
  initialGameState?: GameProgress | null;
  showTutorialProp?: boolean;
  onTimeChange?: (newTimeOfDay: TimeOfDay) => void;
  onLoadGame?: (gameData: GameProgress) => void;
}

export default function NeighborVille({ 
  initialGameState, 
  showTutorialProp = false,
  onTimeChange,
  onLoadGame
}: NeighborVilleProps) {
  const [playerName, setPlayerName] = useState("");
  const [coins, setCoins] = useState(2000);
  const [happiness, setHappiness] = useState(70); 
  const [day, setDay] = useState(1);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [gridSize, setGridSize] = useState<number>(16); 
  const [grid, setGrid] = useState<(Building | null)[]>(Array(64).fill(null)); 
  
  const [gameTime, setGameTime] = useState<number>(8);
  const [gameMinutes, setGameMinutes] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning');
  const [timePaused, setTimePaused] = useState(false);
  const [weather, setWeather] = useState<WeatherType>('sunny');
  
  const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showHappinessAnalytics, setShowHappinessAnalytics] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(showTutorialProp);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [activeTab, setActiveTab] = useState('buildings');
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const [weatherForecast, setWeatherForecast] = useState<WeatherType[]>([]);
  const [showWeatherForecast, setShowWeatherForecast] = useState(false);
  const [totalEnergyUsage, setTotalEnergyUsage] = useState<number>(0);
  const [energyRate, setEnergyRate] = useState<number>(2);
  const [lastBillDay, setLastBillDay] = useState<number>(0);
  const [daysUntilBill, setDaysUntilBill] = useState<number>(5);
  const [hourlyCoinBonus, setHourlyCoinBonus] = useState<number>(0);
  const [happinessDecay, setHappinessDecay] = useState<number>(1.2);
  
  const [powerGrid, setPowerGrid] = useState<PowerGridState>({
    totalPowerProduction: 0,
    totalPowerConsumption: 0,
    connectedBuildings: [],
    powerOutages: []
  });
  
  const [waterGrid, setWaterGrid] = useState<WaterGridState>({
    totalWaterProduction: 0,
    totalWaterConsumption: 0,
    connectedBuildings: [],
    waterShortages: []
  });

  const [buildingCategory, setBuildingCategory] = useState<'all' | 'residential' | 'commercial' | 'utility' | 'entertainment'>('all');
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showSocialFeed, setShowSocialFeed] = useState(true);

  const audioRef = useRef<HTMLAudioElement | HTMLIFrameElement | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<{
    id: string;
    username: string;
    neighborhood: {
      name: string;
      buildings: Building[];
      neighbors: Neighbor[];
      stats: {
        totalHappiness: number;
        totalIncome: number;
        totalResidents: number;
        totalBuildings: number;
      };
    };
  } | null>(null);

  const { user, isAuthenticated } = useAuth();

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
  const [dayRecords, setDayRecords] = useState<{
    day: number;
    coins: number;
    happiness: number;
    residents: number;
    buildings: number;
    income: number;
    expenses: number;
    events: { name: string; type: 'good' | 'bad' | 'neutral' }[];
  }[]>([]);
  const [showCoinHistory, setShowCoinHistory] = useState(false);
  const [coinHistory, setCoinHistory] = useState<CoinHistoryEntry[]>([]);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showSpecialEvents, setShowSpecialEvents] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);

  useEffect(() => {
    if (initialGameState) {
      loadGameState(initialGameState);
    } else {
      initializeNewGame();
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveGameCallback(undefined, true);
      
      e.preventDefault();
      e.returnValue = "You have unsaved progress. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [initialGameState]);

  useEffect(() => {
    if (!timePaused) {
      const timer = setInterval(() => {
        setGameMinutes(prevMinutes => {
          if (prevMinutes >= 59) {

            const newTime = (gameTime + 1) % 24;
            setGameTime(newTime);
            
            let newTimeOfDay: TimeOfDay;
            if (newTime >= 5 && newTime < 10) {
              newTimeOfDay = 'morning';
            } else if (newTime >= 10 && newTime < 17) {
              newTimeOfDay = 'day';
            } else if (newTime >= 17 && newTime < 21) {
              newTimeOfDay = 'evening';
            } else {
              newTimeOfDay = 'night';
            }
            setTimeOfDay(newTimeOfDay);
            
            if (onTimeChange) {
              onTimeChange(newTimeOfDay);
            }
            
            updateWeather(newTime);
            handleHourlyEffects(newTime);
            
            if (newTime === 6) {
              setTimeout(() => {
                handleEndDay();
                saveGameCallback(undefined, true);
              }, 0);
            }
            
            return 0;
          }
          return prevMinutes + 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [timePaused, gameTime, onTimeChange]);

  useEffect(() => {
    if (gameTime % 4 === 0) {
      generateWeatherForecast();
    }
  }, [gameTime]);

  useEffect(() => {
    calculateUtilityGrids();
  }, [grid]);

  useEffect(() => {
    if (!showTutorial && !showMusicModal && musicEnabled === false) {
      setShowMusicModal(true);
    }
  }, [showTutorial]);

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
  };

  const updateWeather = (time: number) => {
    let currentTimeOfDay: TimeOfDay;
    
    if (time >= 5 && time < 10) {
      currentTimeOfDay = 'morning';
    } else if (time >= 10 && time < 17) {
      currentTimeOfDay = 'day';
    } else if (time >= 17 && time < 21) {
      currentTimeOfDay = 'evening';
    } else {
      currentTimeOfDay = 'night';
    }

    const weights: Record<TimeOfDay, Record<WeatherType, number>> = {
      morning: { sunny: 0.6, cloudy: 0.25, rainy: 0.12, stormy: 0.03, snowy: 0 },
      day: { sunny: 0.7, cloudy: 0.2, rainy: 0.08, stormy: 0.02, snowy: 0 },
      evening: { sunny: 0.5, cloudy: 0.3, rainy: 0.15, stormy: 0.05, snowy: 0 },
      night: { sunny: 0.1, cloudy: 0.6, rainy: 0.2, stormy: 0.05, snowy: 0.05 }
    };
    
    const weatherWeights = weights[currentTimeOfDay];
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [weatherType, weight] of Object.entries(weatherWeights)) {
      cumulative += weight;
      if (rand < cumulative) {
        setWeather(weatherType as WeatherType);
        break;
      }
    }
  };

  const generateWeatherForecast = () => {
    const forecast: WeatherType[] = [...weatherForecast];
    
    if (forecast.length === 0) {
      for (let i = 0; i < 6; i++) {
        const hour = (gameTime + i * 4) % 24;
        forecast.push(getWeatherForTime(hour));
      }
    } else {
      forecast.shift();
      const lastTime = (gameTime + 5 * 4) % 24;
      forecast.push(getWeatherForTime(lastTime));
    }
    
    setWeatherForecast(forecast);
  };

  const getWeatherForTime = (hour: number): WeatherType => {
    let timeOfDay: TimeOfDay;
    if (hour >= 5 && hour < 10) {
      timeOfDay = 'morning';
    } else if (hour >= 10 && hour < 17) {
      timeOfDay = 'day';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }
    
    const weights = {
      morning: { sunny: 0.6, cloudy: 0.25, rainy: 0.12, stormy: 0.03, snowy: 0 },
      day: { sunny: 0.7, cloudy: 0.2, rainy: 0.08, stormy: 0.02, snowy: 0 },
      evening: { sunny: 0.5, cloudy: 0.3, rainy: 0.15, stormy: 0.05, snowy: 0 },
      night: { sunny: 0.1, cloudy: 0.6, rainy: 0.2, stormy: 0.05, snowy: 0.05 }
    }[timeOfDay];
    
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [weatherType, weight] of Object.entries(weights)) {
      cumulative += weight;
      if (rand < cumulative) {
        return weatherType as WeatherType;
      }
    }
    
    return 'cloudy';
  };

  const calculateTotalHappiness = useCallback(() => {
    let calculatedHappiness = 70;
    
    grid.forEach(building => {
      if (building && building.happiness) {
        calculatedHappiness += building.happiness;
      }
    });
    
    calculatedHappiness += getWeatherHappinessEffect();
    
    const buildingsWithoutPower = grid.filter(b => b && b.needsElectricity && !b.isConnectedToPower).length;
    if (buildingsWithoutPower > 0) {
      calculatedHappiness -= buildingsWithoutPower * 2;
    }
    
    const buildingsWithoutWater = grid.filter(b => b && b.needsWater && !b.isConnectedToWater).length;
    if (buildingsWithoutWater > 0) {
      calculatedHappiness -= buildingsWithoutWater * 3;
    }
    
    return Math.min(100, Math.max(0, calculatedHappiness));
  }, [grid, weather]);
  
  useEffect(() => {
    const newHappiness = calculateTotalHappiness();
    setHappiness(newHappiness);
  }, [calculateTotalHappiness]);

  const getWeatherHappinessEffect = () => {
    const effects: Record<WeatherType, number> = {
      sunny: 2,
      cloudy: -0.5,
      rainy: -2,
      stormy: -4,
      snowy: -1
    };
    return effects[weather] || 0;
  };

  const calculateUtilityGrids = () => {
    let powerProduction = 0;
    let powerConsumption = 0;
    let waterProduction = 0;
    let waterConsumption = 0;
    const powerOutages: number[] = [];
    const waterShortages: number[] = [];
    
    grid.forEach((building, index) => {
      if (!building) return;
      
      if (building.isPowerGenerator) {
        if (!building.needsWater || building.isConnectedToWater) {
          powerProduction += building.powerOutput || 0;
        }
      }
      
      if (building.isWaterSupply) {
        if (!building.needsElectricity || building.isConnectedToPower) {
          waterProduction += building.waterOutput || 0;
        }
      }
      
      if (building.needsElectricity && building.energyUsage !== undefined) {
        powerConsumption += building.energyUsage;
        if (!building.isConnectedToPower && powerProduction < powerConsumption) {
          powerOutages.push(index);
        }
      }
      
      if (building.needsWater) {
        const waterUsage = 20;
        waterConsumption += waterUsage;
        if (!building.isConnectedToWater && waterProduction < waterConsumption) {
          waterShortages.push(index);
        }
      }
    });
    
    setPowerGrid({
      totalPowerProduction: powerProduction,
      totalPowerConsumption: powerConsumption,
      connectedBuildings: grid.filter((b, i) => b?.isConnectedToPower).map((_, i) => i),
      powerOutages
    });
    
    setWaterGrid({
      totalWaterProduction: waterProduction,
      totalWaterConsumption: waterConsumption,
      connectedBuildings: grid.filter((b, i) => b?.isConnectedToWater).map((_, i) => i),
      waterShortages
    });
  };

  const handleConnectUtility = (fromIndex: number, toIndex: number, utilityType: 'power' | 'water') => {
    const fromBuilding = grid[fromIndex];
    const toBuilding = grid[toIndex];
    
    if (!fromBuilding || !toBuilding) return;
    
    if (utilityType === 'power') {
      if (!fromBuilding.isPowerGenerator || !toBuilding.needsElectricity) return;
    } else {
      if (!fromBuilding.isWaterSupply || !toBuilding.needsWater) return;
    }
    
    const distance = calculateGridDistance(fromIndex, toIndex, Math.sqrt(gridSize));
    const maxDistance = utilityType === 'power' ? 3 : 3;
    
    if (distance > maxDistance) {
      addNotification(`Too far! ${utilityType === 'power' ? 'Power' : 'Water'} can only reach ${maxDistance} tiles away`, 'warning');
      return;
    }
    
    const newGrid = [...grid];
    
    if (utilityType === 'power') {
      const updatedBuilding = {
        ...toBuilding,
        isConnectedToPower: true,
        connectedBuildings: [...(toBuilding.connectedBuildings || []), fromIndex]
      };
      newGrid[toIndex] = updatedBuilding;
      addNotification(`Connected power to ${toBuilding.name}`, 'success');
    } else {
      const updatedBuilding = {
        ...toBuilding,
        isConnectedToWater: true,
        connectedBuildings: [...(toBuilding.connectedBuildings || []), fromIndex]
      };
      newGrid[toIndex] = updatedBuilding;
      addNotification(`Connected water to ${toBuilding.name}`, 'success');
    }
    
    setGrid(newGrid);
  };

  const calculateGridDistance = (index1: number, index2: number, gridWidth: number): number => {
    const x1 = index1 % gridWidth;
    const y1 = Math.floor(index1 / gridWidth);
    const x2 = index2 % gridWidth;
    const y2 = Math.floor(index2 / gridWidth);
    
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  };

  const handleHourlyEffects = (newTime: number) => {
    let hourlyCoinIncome = 0;
    const newGrid = [...grid];
    
    grid.forEach((building, index) => {
      if (building && building.income > 0) {
        let canGenerate = true;
        
        if (building.needsElectricity && !building.isConnectedToPower) {
          canGenerate = false;
        }
        
        if (building.needsWater && !building.isConnectedToWater) {
          canGenerate = false;
        }
        
        if (canGenerate) {
          let income = building.income / 24;
          
          if (building.id === 'cafe' && newTime >= 6 && newTime <= 11) {
            income *= 1.5;
          }
          if (building.id === 'music_venue' && newTime >= 19 && newTime <= 2) {
            income *= 2.0;
          }
          if (building.id === 'solar_panel' && newTime >= 9 && newTime <= 17 && weather === 'sunny') {
            income *= 1.5;
          }
          
          hourlyCoinIncome += income;
        }
      }
    });
    
    if (hourlyCoinIncome > 0) {
      setCoins(coins => coins + Math.round(hourlyCoinIncome));
      setHourlyCoinBonus(Math.round(hourlyCoinIncome));
      setTimeout(() => setHourlyCoinBonus(0), 2000);
      
      addToCoinHistory(Math.round(hourlyCoinIncome), 'Hourly income from buildings', 'income');
    }
    
    const totalResidents = neighbors.filter(n => n.hasHome).length;
    const weatherEffect = getWeatherHappinessEffect();
    const utilityPenalty = calculateUtilityHappinessPenalty();
    
    const happinessLoss = happinessDecay + (totalResidents * 0.2) - weatherEffect + utilityPenalty;
    setHappiness(prev => Math.max(0, prev - happinessLoss));
    
    if (Math.random() < 0.08) { 
      const event = getRandomEvent(day);
      if (event && (event.timeOfDay === timeOfDay || !event.timeOfDay)) {
        setCurrentEvent(event);
      }
    }
  };

  const calculateUtilityHappinessPenalty = (): number => {
    let penalty = 0;
    
    const buildingsWithoutPower = grid.filter((b, i) => 
      b && b.needsElectricity && !b.isConnectedToPower
    ).length;
    
    const buildingsWithoutWater = grid.filter((b, i) => 
      b && b.needsWater && !b.isConnectedToWater
    ).length;
    
    penalty += buildingsWithoutPower * 2;
    penalty += buildingsWithoutWater * 3;
    
    if (powerGrid.totalPowerConsumption > powerGrid.totalPowerProduction) {
      penalty += 5;
    }
    
    if (waterGrid.totalWaterConsumption > waterGrid.totalWaterProduction) {
      penalty += 6;
    }
    
    return penalty;
  };

  const initializeNewGame = () => {
    const name = initialGameState?.playerName || "Mayor";
    setPlayerName(name);
    const startingCoins = 2000;
    setCoins(startingCoins);
    setHappiness(70);
    setDay(1);
    setLevel(1);
    setExperience(0);
    setGridSize(16);
    setGrid(Array(64).fill(null));
    setWeather('sunny');
    setGameTime(8);
    setCoinHistory([{
      id: `init-${Date.now()}`,
      day: 1,
      balance: startingCoins,
      amount: startingCoins,
      type: 'income',
      description: 'Initial funds',
      timestamp: Date.now()
    }]);
  };

  const addToCoinHistory = (amount: number, description: string, type: 'income' | 'expense') => {
    const newEntry: CoinHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      day: day,
      balance: type === 'income' ? coins + amount : coins - amount,
      amount: amount,
      type: type,
      description: description,
      timestamp: Date.now()
    };
    
    setCoinHistory(prev => [...prev, newEntry].slice(-100));
  };

  const loadGameState = (state: GameProgress) => {
    setPlayerName(state.playerName);
    setCoins(state.coins);
    setHappiness(state.happiness !== undefined && state.happiness > 0 ? state.happiness : 70);
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
    setWeather(state.weather || 'sunny');
    setCoinHistory(state.coinHistory || []);
    setPowerGrid(state.powerGrid || {
      totalPowerProduction: 0,
      totalPowerConsumption: 0,
      connectedBuildings: [],
      powerOutages: []
    });
    setWaterGrid(state.waterGrid || {
      totalWaterProduction: 0,
      totalWaterConsumption: 0,
      connectedBuildings: [],
      waterShortages: []
    });
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
    console.log('Tile clicked:', index, 'Selected building:', selectedBuilding, 'Grid at index:', grid[index]);
    
    if (index >= gridSize) return;
    
    if (selectedBuilding && grid[index] === null) {
      console.log('Setting selectedTile to:', index, 'and showing building modal');
      setSelectedTile(index);
      setShowBuildingModal(true);
      console.log('showBuildingModal should now be:', true);
    } else if (!selectedBuilding && grid[index] !== null) {
      setSelectedTile(index);
    } else {
      setSelectedTile(null);
    }
  };

  const handleBuildingComplete = (building: Building, index: number) => {
    if (coins >= building.cost) {
      const newGrid = [...grid];
      newGrid[index] = building;
      
      const newCoins = coins - building.cost;
      const newHappiness = Math.min(100, happiness + building.happiness);
      
      setGrid(newGrid);
      setCoins(newCoins);
      setHappiness(newHappiness);
      
      addNotification(`Built a ${building.name} (+${building.happiness}% happiness)`, 'success');
      setSelectedBuilding(null);
      calculateEnergyUsage(newGrid);
      addToCoinHistory(building.cost, `Purchased ${building.name}`, 'expense');
      
      const gameStateWithBuilding = {
        playerName,
        coins: newCoins,
        happiness: newHappiness,
        day,
        level,
        experience,
        grid: newGrid,
        gridSize,
        neighbors,
        achievements,
        events: [],
        gameTime,
        timeOfDay,
        recentEvents,
        bills,
        energyRate,
        totalEnergyUsage,
        lastBillDay,
        coinHistory,
        weather,
        powerGrid,
        waterGrid
      };
      
      sessionStorage.setItem('neighborville_save', JSON.stringify(gameStateWithBuilding));
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
      if (buildingToDelete.occupants && Array.isArray(buildingToDelete.occupants)) {
        buildingToDelete.occupants.forEach(occupantId => {
          const numericId = typeof occupantId === 'string' ? parseInt(occupantId, 10) : occupantId;
          handleRemoveResident(numericId);
        });
      }
    }
    
    const newGrid = [...grid];
    newGrid[index] = null;
    
    setGrid(newGrid);
    setCoins(coins + Math.floor(buildingToDelete.cost * 0.5));
    setHappiness(Math.max(0, happiness - Math.floor(buildingToDelete.happiness * 0.7)));
    
    addNotification(`Demolished a ${buildingToDelete.name}`, 'info');
    setSelectedTile(null);
    calculateEnergyUsage(newGrid);
    addToCoinHistory(Math.floor(buildingToDelete.cost * 0.5), `Demolished ${buildingToDelete.name}`, 'income');
  };

  const handleMoveBuilding = (fromIndex: number) => {
    addNotification('Moving feature coming soon!', 'info');
  };

  const handleUpgradeBuilding = (building: Building, upgrades: string[]) => {
    const gridIndex = grid.findIndex(b => b && b.id === building.id);
    if (gridIndex === -1) return;
    
    const buildingToUpgrade = grid[gridIndex];
    if (!buildingToUpgrade) return;
    
    const currentLevel = building.level || 0;
    
    const availableUpgrades = getAvailableUpgrades(building.id, currentLevel);

    const selectedUpgrade = availableUpgrades.find(upgrade => upgrade.id === upgrades[0]);
    
    if (!selectedUpgrade) {
      addNotification('Upgrade not available for this building', 'error');
      return;
    }
    
    if (coins < selectedUpgrade.cost) {
      addNotification(`Not enough coins for this upgrade. Need ${selectedUpgrade.cost} coins.`, 'error');
      return;
    }
    
    const currentUpgrades = building.currentUpgrades || [];
    const newUpgrades = [...currentUpgrades, upgrades[0]];
    
    const upgradedStats = calculateUpgradedStats(building, newUpgrades);
    
    const updatedBuilding = {
      ...building,
      level: currentLevel + 1,
      income: upgradedStats.income,
      happiness: upgradedStats.happiness,
      energyUsage: upgradedStats.energyUsage,
      currentUpgrades: newUpgrades
    };
    
    const newGrid = [...grid];
    newGrid[gridIndex] = updatedBuilding;
    setGrid(newGrid);
    
    setCoins(coins - selectedUpgrade.cost);
    
    calculateEnergyUsage(newGrid);
    
    addNotification(`Upgraded ${building.name} with ${selectedUpgrade.name}!`, 'success');

    addToCoinHistory(selectedUpgrade.cost, `Upgrade: ${selectedUpgrade.name} for ${building.name}`, 'expense');
  };

  const handleDemolishBuilding = (gridIndex: number) => {
    handleDeleteBuilding(gridIndex);
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

  const handleEndDay = async () => {
    const baseIncome = grid.slice(0, gridSize).reduce((total, building) => {
      if (building) {
        let income = building.income;
        
        if (building.id === 'cafe' || building.id === 'fancy_restaurant') {
          if (!building.needsElectricity || building.isConnectedToPower) {
            if (!building.needsWater || building.isConnectedToWater) {
              if (building.occupants && building.occupants.length > 0) {
                building.occupants.forEach(occupantId => {
                  const numericId = typeof occupantId === 'string' ? parseInt(occupantId, 10) : occupantId;
                  const occupantIdStr = typeof numericId === 'string' ? numericId : numericId.toString();
                  const occupant = neighbors.find(n => {
                    const nId = typeof n.id === 'string' ? n.id : n.id.toString();
                    return nId === occupantIdStr;
                  });
                  if (occupant) {
                    income += occupant.dailyRent || 0;
                  }
                });
              }
            }
          } else {
            income = 0;
            addNotification(`${building.name} not generating income - no power/water!`, 'warning');
          }
        }
        
        return total + income;
      }
      return total;
    }, 0);
    
    const energyCost = totalEnergyUsage > 0 ? Math.round(totalEnergyUsage * energyRate) : 0;
    const netIncome = baseIncome - energyCost;
    
    const newRecord = {
      day: day,
      coins: coins,
      happiness: happiness,
      residents: neighbors.filter(n => n.hasHome).length,
      buildings: grid.filter(b => b !== null).length,
      income: baseIncome,
      expenses: energyCost,
      events: recentEvents.filter(e => e.day === day).map(e => ({
        name: e.name,
        type: (e.happinessImpact > 0 ? 'good' : e.happinessImpact < 0 ? 'bad' : 'neutral') as 'good' | 'bad' | 'neutral'
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
    if (baseIncome > 0) {
      addToCoinHistory(baseIncome, 'Daily income from buildings', 'income');
    }
    
    if (energyCost > 0) {
      addToCoinHistory(energyCost, 'Daily energy costs', 'expense');
    }
    
    await saveGameCallback(undefined, true);
  };

  const checkForRandomEvent = () => {
    if (Math.random() < 0.5) {
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
    if (option.coins > 0) {
      addToCoinHistory(option.coins, `Event: ${currentEvent?.title}`, 'income');
    } else if (option.coins < 0) {
      addToCoinHistory(Math.abs(option.coins), `Event: ${currentEvent?.title}`, 'expense');
    }
  };

  const updateNeighborHappiness = () => {
    const updatedNeighbors = neighbors.map(neighbor => {
      if (!neighbor.unlocked || !neighbor.hasHome) return neighbor;
      
      let happinessChange = 0;
      let reasons = [];
      
      const house = neighbor.houseIndex !== undefined ? grid[neighbor.houseIndex] : null;
      if (house) {
        if (neighbor.housingPreference === 'house' && house.id === 'apartment') {
          happinessChange -= 25;
          reasons.push('Prefers house over apartment (-25)');
        } else if (neighbor.housingPreference === 'apartment' && house.id === 'house') {
          happinessChange -= 15;
          reasons.push('Prefers apartment over house (-15)');
        }
        
        if (house.occupants && house.occupants.length > (neighbor.maxNeighbors || 1)) {
          happinessChange -= 30;
          reasons.push('Too many roommates (-30)');
        }
        
        if (house.needsElectricity && !house.isConnectedToPower) {
          happinessChange -= 40;
          reasons.push('No electricity (-40)');
        }
        
        if (house.needsWater && !house.isConnectedToWater) {
          happinessChange -= 35;
          reasons.push('No water (-35)');
        }
      }
      
      grid.forEach(building => {
        if (building) {
          if (neighbor.likes && Array.isArray(neighbor.likes)) {
            if (neighbor.likes.some(like => building.name.toLowerCase() === like.toLowerCase())) {
              if (!building.needsElectricity || building.isConnectedToPower) {
                if (!building.needsWater || building.isConnectedToWater) {
                  happinessChange += 20;
                  reasons.push(`Likes ${building.name} (+20)`);
                }
              }
            }
          } else if (neighbor.likes && typeof neighbor.likes === 'string') {
            if (building.name.toLowerCase() === neighbor.likes.toLowerCase()) {
              if (!building.needsElectricity || building.isConnectedToPower) {
                if (!building.needsWater || building.isConnectedToWater) {
                  happinessChange += 20;
                  reasons.push(`Likes ${building.name} (+20)`);
                }
              }
            }
          }
          
          if (neighbor.dislikes && Array.isArray(neighbor.dislikes)) {
            if (neighbor.dislikes.some(dislike => building.name.toLowerCase() === dislike.toLowerCase())) {
              happinessChange -= 25;
              reasons.push(`Dislikes ${building.name} (-25)`);
            }
          } else if (neighbor.dislikes && typeof neighbor.dislikes === 'string') {
            if (building.name.toLowerCase() === neighbor.dislikes.toLowerCase()) {
              happinessChange -= 25;
              reasons.push(`Dislikes ${building.name} (-25)`);
            }
          }
        }
      });
      
      const weatherBonus = getWeatherHappinessEffect();
      happinessChange += weatherBonus;
      if (weatherBonus !== 0) {
        reasons.push(`Weather: ${weather} (${weatherBonus > 0 ? '+' : ''}${weatherBonus})`);
      }
      
      const newHappiness = Math.min(100, Math.max(0, (neighbor.happiness || 70) + happinessChange));
      
      if (newHappiness < 20 && (neighbor.happiness || 70) >= 20) {
        addNotification(`${neighbor.name} is extremely unhappy and might leave! ${reasons.join('. ')}`, 'error');
      } else if (newHappiness < 40 && (neighbor.happiness || 70) >= 40) {
        addNotification(`${neighbor.name} is very unhappy! ${reasons.join('. ')}`, 'warning');
      }
      
      if (newHappiness < 10) {
        handleRemoveResident(neighbor.id);
        addNotification(`${neighbor.name} has left your neighborhood due to poor living conditions!`, 'error');
        return {
          ...neighbor,
          happiness: 60,
          hasHome: false,
          houseIndex: undefined
        };
      }
      
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
      addToCoinHistory(billToPay.amount, `Paid ${billToPay.name}`, 'expense');
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
    
    if (onTimeChange) {
      onTimeChange(newTimeOfDay);
    }
  };

  const handleShowHappinessAnalytics = () => {
    setShowHappinessAnalytics(true);
  };

  const handleAssignResident = (neighborId: string | number, houseIndex: string | number) => {
    const numericNeighborId = typeof neighborId === 'string' ? parseInt(neighborId, 10) : neighborId;
    const numericHouseIndex = typeof houseIndex === 'string' ? parseInt(houseIndex, 10) : houseIndex;
    
    const updatedNeighbors = neighbors.map(neighbor => {
      if (neighbor.id === numericNeighborId) {
        return {
          ...neighbor,
          hasHome: true,
          houseIndex: numericHouseIndex
        };
      }
      return neighbor;
    });
    
    const updatedGrid = [...grid];
    if (updatedGrid[numericHouseIndex]) {
      const building = updatedGrid[numericHouseIndex]!;
      const existingOccupants = building.occupants || [];
      const newOccupants = [...existingOccupants, numericNeighborId.toString()];
      
      updatedGrid[numericHouseIndex] = {
        ...building,
        isOccupied: newOccupants.length > 0,
        occupants: newOccupants
      };
    }
    
    setNeighbors(updatedNeighbors);
    setGrid(updatedGrid);
    
    const neighbor = neighbors.find(n => n.id === numericNeighborId);
    if (neighbor) {
      setHappiness(Math.min(100, happiness + 15));
      addNotification(`${neighbor.name} moved into house #${numericHouseIndex} (+15% happiness)`, 'success');
    }
    
    calculateEnergyUsage(updatedGrid);
    
    if (showBuildingInfo && showBuildingInfo.index === numericHouseIndex) {
      const updatedBuilding = updatedGrid[numericHouseIndex];
      if (updatedBuilding) {
        setShowBuildingInfo({building: updatedBuilding, index: numericHouseIndex});
      }
    }
  };

  const handleRemoveResident = (neighborId: string | number) => {
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
    setHappiness(Math.max(0, happiness - 10));
    
    if (showBuildingInfo && showBuildingInfo.index === neighbor.houseIndex) {
      const updatedBuilding = updatedGrid[neighbor.houseIndex];
      if (updatedBuilding) {
        setShowBuildingInfo({building: updatedBuilding, index: neighbor.houseIndex});
      }
    }
  };

  const handleCollectIncome = (gridIndex: number, amount: number) => {
    const building = grid[gridIndex];
    if (!building) return;
    
    const COLLECTION_COOLDOWN = 24 * 60 * 1000;
    const currentTime = Date.now();
    
    if (building.lastCollectedIncome && currentTime - building.lastCollectedIncome < COLLECTION_COOLDOWN) {
      const timeLeft = COLLECTION_COOLDOWN - (currentTime - building.lastCollectedIncome);
      const hoursLeft = Math.ceil(timeLeft / (60 * 60 * 1000));
      addNotification(`You can collect from this building again in ${hoursLeft} hours`, 'warning');
      return;
    }
    
    if (building.needsElectricity && !building.isConnectedToPower) {
      addNotification(`${building.name} needs power connection to generate income!`, 'warning');
      return;
    }
    
    if (building.needsWater && !building.isConnectedToWater) {
      addNotification(`${building.name} needs water connection to generate income!`, 'warning');
      return;
    }
    
    const newGrid = [...grid];
    newGrid[gridIndex] = {
      ...building,
      lastCollectedIncome: currentTime
    };
    setGrid(newGrid);
    
    setCoins(coins + amount);
    addNotification(`Collected ${amount} coins from your business!`, 'success');
    addToCoinHistory(amount, `Income from ${building?.name || 'business'}`, 'income');
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

  const saveGameCallback = useCallback(async (buildingCompleted?: Building | string, isAutoSave: boolean = false) => {
    const storedPlayerName = localStorage.getItem('neighborville_playerName');
    const isLocallyAuthenticated = !!storedPlayerName;
    
    if (!isAuthenticated && !isLocallyAuthenticated && !user && !isAutoSave) {
      setShowAuthModal(true);
      return;
    }
    
    const now = Date.now();
    const lastSaveTimestamp = localStorage.getItem('neighborville_last_save_timestamp');
    
    if (isAutoSave && !shouldSaveGame(lastSaveTimestamp, 60000)) {
      return;
    }

    setAutoSaving(true);
    
    const gameState: GameProgress = {
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
      recentEvents,
      bills,
      energyRate,
      totalEnergyUsage,
      lastBillDay,
      coinHistory,
      weather,
      powerGrid,
      waterGrid
    };
    
    try {
      localStorage.setItem('neighborville_save', JSON.stringify(gameState));
      
      if (isAutoSave) {
        localStorage.setItem('neighborville_last_save_timestamp', now.toString());
        localStorage.setItem('neighborville_autosave', JSON.stringify(gameState));
      }
      
      const saveType = isAutoSave ? 'auto' : 'manual';
      
      if (isAuthenticated && user && !user.isGuest) {
        try {
          const saveResult = await cloudSave.saveToCloud(gameState, saveType);
          
          if (!saveResult && !isAutoSave) {
            await cloudSave.saveToCloud(gameState, saveType);
          }
          
          setLastSaveTime(new Date());
        } catch (error) {
          if (!isAutoSave) {
            addNotification('Local save successful, but cloud save failed', 'warning');
          }
        }
      } else {
        setLastSaveTime(new Date());
      }
      
      if (!isAutoSave) {
        if (typeof buildingCompleted === 'object' && buildingCompleted !== null) {
          addNotification(`${buildingCompleted.name} built and saved!`, 'success');
        } else {
          addNotification('Game saved successfully!', 'success');
        }
      }
    } catch (error) {
      if (!isAutoSave) {
        addNotification('Failed to save game', 'error');
      }
    } finally {
      setAutoSaving(false);
    }
  }, [playerName, coins, happiness, day, level, experience, grid, gridSize, neighbors, 
      achievements, gameTime, timeOfDay, recentEvents, bills, 
      energyRate, totalEnergyUsage, lastBillDay, coinHistory, weather, powerGrid, waterGrid, isAuthenticated, user, addNotification]);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveGameCallback(undefined, true);
    }, 600000);
    return () => clearInterval(autoSaveInterval);
  }, [saveGameCallback]);

  useEffect(() => {
    if (playerName && day > 1 && day % 5 === 0) {
      saveGameCallback(undefined, true);
    }
  }, [day, playerName, saveGameCallback]);

  const handleEnableMusic = async (enable: boolean) => {
    setMusicEnabled(enable);
    setShowMusicModal(false);
    
    if (enable) {
      const script = document.createElement('script');
      script.src = 'https://w.soundcloud.com/player/api.js';
      script.async = true;
      document.head.appendChild(script);
      
      await new Promise(resolve => {
        if ((window as any).SC) {
          resolve(true);
        } else {
          script.onload = () => resolve(true);
        }
      });
      
      const iframe = document.createElement('iframe');
      iframe.width = '0';
      iframe.height = '0';
      iframe.style.visibility = 'hidden';
      iframe.scrolling = 'no';
      iframe.frameBorder = 'no';
      iframe.allow = 'autoplay';
      iframe.src = 'https://w.soundcloud.com/player/?url=https://soundcloud.com/d0mkaaa/neighborville-soundtrack&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&visual=false';
      
      document.body.appendChild(iframe);
      audioRef.current = iframe;
      
      addNotification('Music started! 🎵', 'success');
    }
  };

  const getCategorizedBuildings = () => {
    return buildings.filter(building => {
      switch (buildingCategory) {
        case 'residential':
          return building.id === 'house' || building.id === 'apartment' || building.id === 'condo';
        case 'commercial':
          return building.id === 'cafe' || building.id === 'fancy_restaurant' || building.id === 'tech_hub';
        case 'utility':
          return building.id === 'solar_panel' || building.id === 'power_plant' || building.id === 'water_tower' || building.id === 'water_pump' || building.id === 'charging_station';
        case 'entertainment':
          return building.id === 'park' || building.id === 'library' || building.id === 'music_venue' || building.id === 'movie_theater';
        default:
          return true;
      }
    });
  };

  const handlePlayerNameClick = () => {
    setShowPlayerStats(true);
  };

  const toggleMusic = () => {
    setMusicEnabled(!musicEnabled);
    if (musicEnabled && audioRef.current) {
      audioRef.current.remove();
      audioRef.current = null;
    } else {
      handleEnableMusic(true);
    }
  };

  const handleShowSettings = () => {
    setShowSettings(true);
  };

  const handlePurchaseMarketItem = (item: any) => {
    if (coins >= item.price) {
      setCoins(coins - item.price);
      addNotification(`Purchased ${item.name} for ${item.price} coins!`, 'success');
      
      switch (item.itemType) {
        case 'building_upgrade':
          addNotification('Building happiness bonus increased by 5%!', 'success');
          break;
        case 'service':
          addNotification('Energy consumption reduced for 3 days!', 'success');
          break;
        case 'material':
          addNotification('Building costs reduced by 10% for 5 buildings!', 'success');
          break;
        case 'rare':
          if (item.id === 'happiness_charm') {
            setHappiness(Math.min(100, happiness + 10));
            addNotification('Neighborhood happiness increased by 10%!', 'success');
          }
          break;
      }
    } else {
      addNotification('Not enough coins!', 'error');
    }
  };

  const handleSellMarketItem = (itemId: string, price: number) => {
    setCoins(coins + price);
    addNotification(`Sold ${itemId} for ${price} coins!`, 'success');
  };

  const handleParticipateSpecialEvent = (eventId: string, activityId: string) => {
    console.log('Participating in special event:', eventId, activityId);
  };

  const handleClaimSpecialEventReward = (eventId: string) => {
    console.log('Claiming special event reward:', eventId);
  };

  const handleLogin = (userData: { id: string; username: string; email?: string; isGuest?: boolean }) => {
    setPlayerName(userData.username);
    sessionStorage.setItem('neighborville_playerName', userData.username);
    setShowAuthModal(false);
  };

  const handleViewProfile = (username: string) => {
    console.log('Viewing profile for:', username);
    
    addNotification(`Viewing ${username}'s profile coming soon!`, 'info');
    
    setShowLeaderboard(false);
  };

  useEffect(() => {
    const storedName = sessionStorage.getItem('neighborville_playerName');
    const isGuestUser = storedName?.startsWith('Guest_') || user?.isGuest;
    
    console.log('AUTH DEBUG: NeighborVille auth check - storedName =', storedName || 'null', 
      'isAuthenticated =', isAuthenticated, 
      'user =', user?.username || 'null',
      'isGuestUser =', isGuestUser);
    
    if (!playerName && !isAuthenticated && !user && !storedName) {
      console.log('AUTH DEBUG: No authentication found in NeighborVille, showing auth modal');
      setShowAuthModal(true);
    } else {
      console.log('AUTH DEBUG: Authentication found in NeighborVille, not showing auth modal');
      setShowAuthModal(false);
      
      if (!playerName) {
        const newPlayerName = (user?.username && !user.username.includes('@')) 
          ? user.username 
          : (storedName && !storedName.includes('@')) 
            ? storedName 
            : 'Mayor';
            
        console.log('AUTH DEBUG: Setting playerName to', newPlayerName);
        setPlayerName(newPlayerName);
        
        if (user?.username && !user.username.includes('@')) {
          sessionStorage.setItem('neighborville_playerName', user.username);
        }
      }
    }
  }, [playerName, isAuthenticated, user]);

  const handleLogout = () => {
    setPlayerName("");
    localStorage.removeItem('neighborville_playerName');
    setShowAuthModal(true);
  };

  const handleSaveGame = () => {
    saveGameCallback(undefined, false);
  };

  return (
    <AppLayout 
      header={
        <div>
          <GameHeader
            playerName={playerName}
            coins={coins}
            happiness={happiness}
            energy={totalEnergyUsage || 0}
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
            onEndDay={handleEndDay}
            onOpenSaveManager={() => setShowSaveManager(true)}
            onShowSettings={handleShowSettings}
            onShowTutorial={() => setShowTutorial(true)}
            onShowAchievements={() => setShowAchievements(true)}
            onToggleTimePause={toggleTimePause}
            onTimeChange={handleTimeChange}
            onShowHappinessAnalytics={handleShowHappinessAnalytics}
            onShowCalendar={() => setShowCalendar(true)}
            onToggleWeatherForecast={() => setShowWeatherForecast(!showWeatherForecast)}
            onShowCoinHistory={() => setShowCoinHistory(true)}
            onPlayerNameClick={handlePlayerNameClick}
            autoSaving={autoSaving}
            lastSaveTime={lastSaveTime}
            onProfileClick={() => setShowAuthModal(true)}
            isMusicPlaying={musicEnabled}
            onToggleMusic={toggleMusic}
            onLogout={handleLogout}
            onSaveGame={handleSaveGame}
          />
          
          <AnimatePresence>
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
      showFooter={false}
    >
      
      <NotificationSystem 
        notifications={notifications}
        removeNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />
      
      <NeighborSocialFeed
        neighbors={neighbors}
        grid={grid}
        onClose={() => setShowSocialFeed(false)}
        currentDay={day}
        timeOfDay={timeOfDay}
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
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-medium lowercase text-emerald-800">available buildings</h2>
                  <Dropdown
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'residential', label: 'Residential' },
                      { value: 'commercial', label: 'Commercial' },
                      { value: 'utility', label: 'Utility' },
                      { value: 'entertainment', label: 'Entertainment' }
                    ]}
                    value={buildingCategory}
                    onChange={(value) => setBuildingCategory(value as typeof buildingCategory)}
                    className="w-32"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {getCategorizedBuildings().map((building) => (
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
                  playerLevel={level}
                  onExpand={(newSize, cost) => {
                    if (coins >= cost) {
                      setCoins(coins - cost);
                      setGridSize(newSize);
                      addNotification(`Plot expanded to ${Math.sqrt(newSize)}×${Math.sqrt(newSize)}!`, 'success');
                      addToCoinHistory(cost, `Plot expansion to ${Math.sqrt(newSize)}×${Math.sqrt(newSize)}`, 'expense');
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
                powerGrid={powerGrid}
                waterGrid={waterGrid}
                onConnectUtility={handleConnectUtility}
                showUtilityMode={activeTab === 'utilities'}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-24 right-4 space-y-2 flex flex-col">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowLeaderboard(true)}
          className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 text-white rounded-full shadow-lg transition-all flex items-center justify-center"
          title="Leaderboard"
        >
          🏆
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowMarketplace(true)}
          className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full shadow-lg transition-all flex items-center justify-center"
        >
          🛍️
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSpecialEvents(true)}
          className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-full shadow-lg transition-all flex items-center justify-center"
        >
          🎉
        </motion.button>
      </div>
      
      <AnimatePresence>
        {(autoSaving || lastSaveTime) && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-24 right-4 z-30 group"
          >
            <div className="relative">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`rounded-full shadow-md w-10 h-10 flex items-center justify-center cursor-help ${
                  autoSaving ? 'bg-emerald-500' : 'bg-white/80 backdrop-blur-sm'
                }`}
              >
                {autoSaving ? (
                  <div className="relative">
                    <Save size={18} className="text-white z-10 relative" />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 rounded-full bg-emerald-300/50"
                    />
                  </div>
                ) : (
                  <Save size={18} className="text-emerald-500" />
                )}
              </motion.div>
              
              <div className="absolute top-full right-0 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/80 text-white text-xs p-2 rounded whitespace-nowrap pointer-events-none">
                {autoSaving 
                  ? 'Auto-saving game...' 
                  : lastSaveTime 
                    ? `Last saved: ${lastSaveTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` 
                    : ''}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <SaveManager 
        isOpen={showSaveManager}
        onClose={() => setShowSaveManager(false)}
        onSave={(name) => saveGameCallback(name)}
        onLoadGame={(gameData) => {
          loadGameState(gameData);
          if (onLoadGame) {
            onLoadGame(gameData);
          }
        }}
        onSaveToServer={async () => {
          console.log('Manual server save triggered from SaveManager');
          
          const currentGameState: GameProgress = {
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
            recentEvents,
            bills,
            energyRate,
            totalEnergyUsage,
            lastBillDay,
            coinHistory,
            weather,
            powerGrid,
            waterGrid
          };
          
          try {
            const result = await saveGameToServer(currentGameState);
            if (result) {
              setLastSaveTime(new Date());
              addNotification('Game saved to server!', 'success');
            } else {
              addNotification('Failed to save to server', 'error');
            }
            return result;
          } catch (error) {
            console.error('Error saving to server:', error);
            addNotification('Error saving to server', 'error');
            return false;
          }
        }}
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
          lastBillDay,
          coinHistory,
          weather,
          powerGrid,
          waterGrid
        }}
        isAuthenticated={isAuthenticated}
        lastServerSaveTime={lastSaveTime}
        onShowLogin={() => setShowAuthModal(true)}
        addNotification={addNotification}
      />

      <MusicControls
        audioRef={audioRef}
        musicEnabled={musicEnabled}
        onToggleMusic={toggleMusic}
      />

      <AnimatePresence>
        {showMarketplace && (
          <Marketplace
            neighbors={neighbors}
            coins={coins}
            day={day}
            onClose={() => setShowMarketplace(false)}
            onPurchase={handlePurchaseMarketItem}
            onSellItem={handleSellMarketItem}
            grid={grid}
            onUpdateGameState={(updates) => {
              if (updates.coins !== undefined) setCoins(updates.coins);
              if (updates.happiness !== undefined) setHappiness(updates.happiness);
              if (updates.experience !== undefined) setExperience(updates.experience);
              if (updates.day !== undefined) setDay(updates.day);
              if (updates.gameTime !== undefined) setGameTime(updates.gameTime);
              if (updates.totalEnergyUsage !== undefined) setTotalEnergyUsage(updates.totalEnergyUsage);
            }}
            playerLevel={level}
            gameProgress={{
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
              lastBillDay,
              coinHistory,
              weather,
              powerGrid,
              waterGrid
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSpecialEvents && (
            <SpecialEvents
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
                lastBillDay,
                coinHistory,
                weather,
                powerGrid,
                waterGrid
              }}
              neighbors={neighbors}
              grid={grid}
              onClose={() => setShowSpecialEvents(false)}
              onParticipate={handleParticipateSpecialEvent}
              onClaimReward={handleClaimSpecialEventReward}
              onUpdateGameState={(updates) => {
                if (updates.coins !== undefined) setCoins(updates.coins);
                if (updates.happiness !== undefined) setHappiness(updates.happiness);
                if (updates.experience !== undefined) setExperience(updates.experience);
              }}
            />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBuildingModal && selectedBuilding && selectedTile !== null && (
          <BuildingModal
            building={selectedBuilding}
            onClose={() => {
              setShowBuildingModal(false);
              setSelectedBuilding(null);
              setSelectedTile(null);
            }}
            onComplete={handleBuildingComplete}
            onSaveGame={async () => saveGameCallback(undefined, false)}
            selectedIndex={selectedTile}
            playerCoins={coins}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            musicEnabled={musicEnabled}
            onToggleMusic={toggleMusic}
            audioRef={audioRef}
            onShowTutorial={() => {
              setShowSettings(false);
              setShowTutorial(true);
            }}
            onShowStats={() => {
              setShowSettings(false);
              setShowPlayerStats(true);
            }}
            isAuthenticated={isAuthenticated}
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onShowAuthModal={() => {
              setShowSettings(false);
              setShowAuthModal(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlayerStats && (
          <PlayerStatsModal 
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
              lastBillDay,
              coinHistory,
              weather,
              powerGrid,
              waterGrid
            }}
            achievements={achievements}
            neighbors={neighbors}
            grid={grid}
            onClose={() => setShowPlayerStats(false)}
            onShowLogin={() => {
              setShowPlayerStats(false);
              setShowAuthModal(true);
            }}
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
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <HappinessAnalytics
                happiness={happiness}
                buildings={buildings}
                neighbors={neighbors}
                grid={grid}
                recentEvents={recentEvents}
                weather={weather}
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
            onMoveBuilding={handleMoveBuilding}
            onUpgradeBuilding={handleUpgradeBuilding}
            onDemolishBuilding={handleDemolishBuilding}
            grid={grid}
            coins={coins}
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
        {showCoinHistory && (
          <CoinHistory 
            history={coinHistory}
            onClose={() => setShowCoinHistory(false)}
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

      <AnimatePresence>
        {showMusicModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
            >
              <h3 className="text-lg font-medium text-emerald-800 mb-4 lowercase">would you like music?</h3>
              <p className="text-gray-600 mb-6 lowercase">enjoy some background music while you build your neighborhood?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleEnableMusic(true)}
                  className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-600 transition-colors lowercase flex items-center justify-center gap-2"
                >
                  <Volume2 size={16} />
                  yes please
                </button>
                <button
                  onClick={() => handleEnableMusic(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors lowercase flex items-center justify-center gap-2"
                >
                  <VolumeX size={16} />
                  no thanks
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
        />
      )}

      {showPublicProfile && selectedProfile && (
        <PublicProfileModal
          onClose={() => setShowPublicProfile(false)}
          profile={selectedProfile}
        />
      )}
      
      {showLeaderboard && (
        <Leaderboard
          onClose={() => setShowLeaderboard(false)}
          onViewProfile={handleViewProfile}
        />
      )}
    </AppLayout>
  );
}