import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameGrid from "./GameGrid";
import BuildingSelector from "../ui/BuildingSelector";
import GameHeader from "./GameHeader";
import NeighborList from "../ui/NeighborList";
import NeighborCard from "./NeighborCard";
import BuildingModal from "./BuildingModal";
import BuildingInfoModal from "./BuildingInfoModal";
import EventModal from "./EventModal";
import NeighborUnlockModal from "./NeighborUnlockModal";
import SidebarPanel from "../ui/SidebarPanel";
import { Home, Users, Calendar, FileText, Zap, User, Save, Volume2, VolumeX } from "lucide-react";
import NeighborListModal from "./NeighborListModal";
import GameFloatingButtons from "./GameFloatingButtons";
import SeasonalEventsPanel from "./SeasonalEventsPanel";
import AchievementsModal from "./AchievementsModal";
import AchievementUnlockModal from "./AchievementUnlockModal";
import EnergyUsagePanel from "./EnergyUsagePanel";
import BillsPanel from "./BillsPanel";
import NotificationSystem from "./NotificationSystem";
import type { ExtendedNotification } from "./NotificationSystem";
import PlotExpansion from "./PlotExpansion";
import ProgressBar from "./ProgressBar";
import ResidentAssignment from "./ResidentAssignment";
import TimeBonus from "./TimeBonus";
import { getRandomEvent } from "../../data/events";
import CoinHistory from "./CoinHistory";
import CalendarView from "./CalendarView";
import ModalWrapper from "../ui/ModalWrapper";
import SettingsModal from "./SettingsModal";
import WeatherForecast from "./WeatherForecast";
import { calculateSeasonalBonuses, getCurrentSeason, checkForSeasonalEvent } from "../../data/seasons";
import { getAvailableUpgrades, calculateUpgradedStats } from "../../data/upgrades";
import SaveManager from "./SaveManager";
import TutorialGuide from "./TutorialGuide";
import Marketplace from "./Marketplace";
import type { MarketItem } from "./Marketplace";
import SpecialEventsManager from "./SpecialEvents";
import UtilityGrid from "./UtilityGrid";
import NeighborSocialFeed from "./NeighborSocialFeed";
import BackgroundBubbles from "./BackgroundBubbles";
import PlayerStatsModal from "./PlayerStatsModal";
import PublicProfileModal from "../profile/PublicProfileModal";
import MusicControls from "./MusicControls";
import { saveGameToServer, loadGameFromServer, shouldSaveGame } from "../../services/gameService";
import ContinueModal from "./ContinueModal";
import GameLayout from "../ui/GameLayout";
import GlassCard from "../ui/GlassCard";
import BuildingUpgradesModal from "./BuildingUpgradesModal";
import AuthModal from "../auth/AuthModal";
import Leaderboard from "../profile/Leaderboard";
import Dropdown from "../ui/Dropdown";
import BuildingOption from "./BuildingOption";
import type { 
  Building, 
  GameProgress, 
  TimeOfDay, 
  WeatherType,
  PowerGridState,
  WaterGridState,
  Neighbor,
  Bill,
  GameEvent,
  RecentEvent,
  Achievement,
  CoinHistoryEntry,
  EventOption
} from "../../types/game";
import { buildings as initialBuildings } from "../../data/buildings";
import { neighborProfiles } from "../../data/neighbors";
import { ACHIEVEMENTS } from "../../data/achievements";
import { useAuth } from "../../context/AuthContext";
import AppLayout from "../ui/AppLayout";

interface NeighborVilleProps {
  initialGameState?: GameProgress | null;
  showTutorialProp?: boolean;
  onTimeChange?: (newTimeOfDay: TimeOfDay) => void;
  onLoadGame?: (gameData: GameProgress) => void;
}

const getWeatherHappinessEffect = () => 0;

const timeBonuses: any[] = [];

type Notification = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  autoRemove: boolean;
};

export default function NeighborVille({ 
  initialGameState, 
  showTutorialProp = false,
  onTimeChange,
  onLoadGame
}: NeighborVilleProps) {
  const [playerName, setPlayerName] = useState("");
  const [coins, setCoins] = useState(2000);
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
  const [timeSpeed, setTimeSpeed] = useState<1|2|3>(1);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [showSaveManager, setShowSaveManager] = useState(false);
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

  const { user, isAuthenticated, setShowLogin } = useAuth();

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
  const [activeSeasonalEvents, setActiveSeasonalEvents] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const initFlags = useRef({
    gameInitialized: false,
    authProcessed: false,
    gameStateLoaded: false
  });

  const addNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', autoRemove: boolean = true) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
      autoRemove
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const saveGameCallback = useCallback(async (buildingCompleted?: Building | string, isAutoSave: boolean = false) => {
    if (!user) {
      console.warn('Cannot save game: user not authenticated');
      setShowAuthModal(true);
      return;
    }
    
    const now = Date.now();
    const lastSaveTimestamp = sessionStorage.getItem('neighborville_last_save_timestamp');
    
    if (isAutoSave && !shouldSaveGame(lastSaveTimestamp, 60000)) {
      return;
    }

    setAutoSaving(true);
    
    const gameState: GameProgress = {
      playerName,
      coins,
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
      waterGrid,
      saveTimestamp: now
    };
    
    try {
      if (isAutoSave) {
        sessionStorage.setItem('neighborville_last_save_timestamp', now.toString());
      }
      
      const saveType = isAutoSave ? 'auto' : 'manual';
      const saveResult = await saveGameToServer(gameState);
      
      if (saveResult) {
        setLastSaveTime(new Date());
        if (!isAutoSave) {
          if (typeof buildingCompleted === 'object' && buildingCompleted !== null) {
            addNotification(`${buildingCompleted.name} built and saved!`, 'success');
          } else {
            addNotification('Game saved successfully!', 'success');
          }
        }
      } else {
        if (!isAutoSave) {
          addNotification('Failed to save game. Please try again.', 'warning');
        }
      }
    } catch (error) {
      if (!isAutoSave) {
        addNotification('Failed to save game', 'error');
      }
      console.error('Error saving game:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [playerName, coins, day, level, experience, grid, gridSize, neighbors, 
      achievements, gameTime, timeOfDay, recentEvents, bills, 
      energyRate, totalEnergyUsage, lastBillDay, coinHistory, weather, powerGrid, waterGrid, user]);

  const initializeNewGame = useCallback(() => {
    const name = initialGameState?.playerName || "Mayor";
    setPlayerName(name);
    const startingCoins = 2000;
    setCoins(startingCoins);
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
  }, [initialGameState]);

  const loadGameStateRef = useRef((state: GameProgress) => {
    if (initFlags.current.gameStateLoaded) {
      console.log('Game state already loaded, skipping');
      return;
    }
    
    console.log('Loading game state once:', state.playerName);
    
    const batchedUpdates = {
      playerName: state.playerName || "",
      coins: state.coins || 2000,
      day: state.day || 1,
      level: state.level || 1,
      experience: state.experience || 0,
      grid: state.grid || Array(64).fill(null),
      gridSize: state.gridSize || 16,
      gameTime: state.gameTime || 8,
      gameMinutes: state.gameMinutes || 0,
      timeOfDay: state.timeOfDay || 'morning',
      bills: state.bills || [],
      totalEnergyUsage: state.totalEnergyUsage || 0,
      energyRate: state.energyRate || 2,
      lastBillDay: state.lastBillDay || 0,
      recentEvents: state.recentEvents || [],
      weather: state.weather || 'sunny',
      coinHistory: state.coinHistory || [],
      powerGrid: state.powerGrid || {
        totalPowerProduction: 0,
        totalPowerConsumption: 0,
        connectedBuildings: [],
        powerOutages: []
      },
      waterGrid: state.waterGrid || {
        totalWaterProduction: 0,
        totalWaterConsumption: 0,
        connectedBuildings: [],
        waterShortages: []
      }
    };
    
    console.log(`Loading time from save: ${batchedUpdates.gameTime}:00`);
    
    const savedGameTime = batchedUpdates.gameTime;
    
    setPlayerName(batchedUpdates.playerName);
    setCoins(batchedUpdates.coins);
    setDay(batchedUpdates.day);
    setLevel(batchedUpdates.level);
    setExperience(batchedUpdates.experience);
    setGrid(batchedUpdates.grid);
    setGridSize(batchedUpdates.gridSize);
    setGameTime(savedGameTime);
    setGameMinutes(batchedUpdates.gameMinutes);
    setTimeOfDay(batchedUpdates.timeOfDay);
    setBills(batchedUpdates.bills);
    setTotalEnergyUsage(batchedUpdates.totalEnergyUsage);
    setEnergyRate(batchedUpdates.energyRate);
    setLastBillDay(batchedUpdates.lastBillDay);
    setRecentEvents(batchedUpdates.recentEvents);
    setWeather(batchedUpdates.weather);
    setCoinHistory(batchedUpdates.coinHistory);
    setPowerGrid(batchedUpdates.powerGrid);
    setWaterGrid(batchedUpdates.waterGrid);
    
    const currentLevel = state.level || 1;
    const unlockedBuildings = initialBuildings.map(building => ({
      ...building,
      unlocked: building.levelRequired ? currentLevel >= building.levelRequired : true
    }));
    
    setBuildings(unlockedBuildings);
    
    const loadedNeighbors = neighborProfiles.map(neighbor => {
      const savedNeighbor = state.neighbors?.find(n => n.id === neighbor.id);
      return savedNeighbor || neighbor;
    });
    
    setNeighbors(loadedNeighbors);
    
    gameTimeRef.current = savedGameTime;
    
    initFlags.current.gameStateLoaded = true;
    
    console.log(`Game loaded with time ${savedGameTime}:00, ready for weather generation`);
  });

  const gameTimeRef = useRef<number>(8);
  
  const loadGameState = (state: GameProgress) => {
    if (!state) return;
    loadGameStateRef.current(state);
  };
  
  useEffect(() => {
    if (initFlags.current.gameInitialized) {
      return;
    }
    
    initFlags.current.gameInitialized = true;
    console.log("Initializing game once...");
    
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
  }, []);
  
  useEffect(() => {
    if (initFlags.current.authProcessed) {
      return;
    }
    
    const authCheckTimer = setTimeout(() => {
      initFlags.current.authProcessed = true;
      console.log('Processing auth once');
      
      const storedName = sessionStorage.getItem('neighborville_playerName');
      const isGuestUser = storedName?.startsWith('Guest_') || (user && user.isGuest);
      
      if (!playerName && !initFlags.current.gameStateLoaded) {
        const newPlayerName = (user?.username && !user.username.includes('@')) 
          ? user.username 
          : (storedName && !storedName.includes('@')) 
            ? storedName 
            : 'Mayor';
          
        console.log('AUTH: Setting initial playerName to', newPlayerName);
        setPlayerName(newPlayerName);
        
        if (user?.username && !user.username.includes('@')) {
          sessionStorage.setItem('neighborville_playerName', user.username);
        }
      }
      
      if (!isAuthenticated && !user && !isGuestUser) {
        console.log('AUTH: No authentication found, showing auth modal');
        setShowAuthModal(true);
        setShowLogin(true);
      } else {
        setShowAuthModal(false);
      }
    }, 500);
    
    return () => {
      clearTimeout(authCheckTimer);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('AUTH: Not authenticated in NeighborVille, showing login modal');
      setShowAuthModal(true);
      setShowLogin(true);
      return;
    }
    
    if (user && (!user.username || user.username.includes('@'))) {
      console.log('AUTH: Missing username in NeighborVille, showing login modal');
      setShowAuthModal(true);
      setShowLogin(true);
      return;
    }
    
    if (user?.username && !playerName) {
      console.log('AUTH: Setting playerName from user in NeighborVille:', user.username);
      setPlayerName(user.username);
    }
  }, [isAuthenticated, user, setShowLogin, playerName]);

  const calculateEnergyUsage = useCallback((currentGrid = grid) => {
    let usage = 0;
    currentGrid.forEach(building => {
      if (building && building.energyUsage !== undefined) {
        usage += building.energyUsage;
      }
    });
    setTotalEnergyUsage(usage);
  }, [grid]);

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
  }, [initialGameState, saveGameCallback]);

  useEffect(() => {
    if (initFlags.current.gameStateLoaded) {
      console.log(`Weather useEffect: Generating forecast for day ${day} with time ${gameTime}:00`);
      generateWeatherForecast();
    }
  }, [day, initFlags.current.gameStateLoaded, gameTime]);

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
            
            updateCurrentWeather(newTime);
            handleHourlyEffects(newTime);
            
            if (newTime === 6) {
              setTimeout(() => {
                handleEndDay();
                saveGameCallback(undefined, true);
              }, 0);
            }
            
            if (newTime === 0) {
              generateWeatherForecast();
            }
            
            return 0;
          }
          return prevMinutes + timeSpeed;
        });
      }, 1000 / timeSpeed);
      
      return () => clearInterval(timer);
    }
  }, [timePaused, gameTime, onTimeChange, timeSpeed]);

  const calculateUtilityGrids = useCallback(() => {
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
    
    setPowerGrid(prevPowerGrid => ({
      totalPowerProduction: powerProduction,
      totalPowerConsumption: powerConsumption,
      connectedBuildings: grid.filter((b, i) => b?.isConnectedToPower).map((_, i) => i),
      powerOutages
    }));
    
    setWaterGrid(prevWaterGrid => ({
      totalWaterProduction: waterProduction,
      totalWaterConsumption: waterConsumption,
      connectedBuildings: grid.filter((b, i) => b?.isConnectedToWater).map((_, i) => i),
      waterShortages
    }));
  }, [grid]);
  
  useEffect(() => {
    calculateUtilityGrids();
  }, [calculateUtilityGrids]);

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

  const updateCurrentWeather = (time: number) => {
    if (weatherForecast.length > 0) {
      const hourIndex = time % 24;
      if (hourIndex < weatherForecast.length) {
        const newWeather = weatherForecast[hourIndex];
        console.log(`Updating weather at ${time}:00 to ${newWeather} (from forecast)`);
        setWeather(newWeather);
      }
    }
  };

  const generateWeatherForecast = () => {
    console.log(`Generating weather forecast for day ${day}`);
    
    if (!initFlags.current.gameStateLoaded) {
      console.log('Weather forecast generation skipped - game not fully loaded yet');
      return;
    }
    
    const currentTime = gameTime;
    
    const newForecast: WeatherType[] = [];
    const seed = day * 100;
    
    for (let i = 0; i < 24; i++) {
      const weatherIndex = Math.floor(((seed + i * 13) % 100) / 20);
      const weatherTypes: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'];
      newForecast.push(weatherTypes[weatherIndex]);
    }
    
    console.log(`New 24-hour forecast generated: ${newForecast.join(', ')}`);
    setWeatherForecast(newForecast);
    
    const currentHour = currentTime % 24;
    if (newForecast.length > currentHour) {
      const newWeather = newForecast[currentHour];
      console.log(`Setting current weather to ${newWeather} based on forecast hour ${currentHour}`);
      setWeather(newWeather);
    }
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
    
    const happinessLoss = 1.2 + (totalResidents * 0.2) - weatherEffect + utilityPenalty;
    
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

  const addToCoinHistory = useCallback((amount: number, description: string, type: 'income' | 'expense') => {
    setCoinHistory(prev => {
      const newEntry: CoinHistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        day: day,
        balance: type === 'income' ? coins + amount : coins - amount,
        amount: amount,
        type: type,
        description: description,
        timestamp: Date.now()
      };
      return [...prev, newEntry].slice(-100);
    });
  }, [day, coins]);

  const handleBuildingSelect = useCallback((building: Building) => {
    console.log('Building selected:', building);
    setSelectedBuilding(building);
    setSelectedTile(null);
  }, []);

  const handleTileClick = useCallback((index: number) => {
    console.log('Tile clicked:', index, 'Selected building:', selectedBuilding, 'Grid at index:', grid[index]);
    
    if (index >= gridSize) return;
    
    if (selectedBuilding && grid[index] === null) {
      console.log('Setting selectedTile to:', index, 'and showing building modal');
      setSelectedTile(index);
      setTimeout(() => {
        setShowBuildingModal(true);
        console.log('showBuildingModal should now be:', true);
      }, 0);
    } else if (!selectedBuilding && grid[index] !== null) {
      const building = grid[index];
      if (building) {
        setShowBuildingInfo({building, index});
      }
      setSelectedTile(null);
    } else {
      setSelectedTile(null);
      setSelectedBuilding(null);
    }
  }, [selectedBuilding, grid, gridSize]);

  const handleBuildingComplete = useCallback((building: Building, index: number) => {
    if (!building || index === null || index < 0 || coins < building.cost) {
      console.log('Invalid building completion attempt:', building?.name, 'at index', index);
      return;
    }
    
    console.log('Building complete:', building.name, 'at index', index);
    
    try {
      const newGrid = [...grid];
      newGrid[index] = building;
      
      const newCoins = coins - building.cost;
      
      setGrid(newGrid);
      setCoins(newCoins);
      
      setSelectedBuilding(null);
      
      setTimeout(() => {
        setShowBuildingModal(false);
        addNotification(`Built a ${building.name}`, 'success');
        setTimeout(() => {
          calculateEnergyUsage(newGrid);
        }, 10);
      }, 10);
      
      addToCoinHistory(building.cost, `Purchased ${building.name}`, 'expense');
    } catch (error) {
      console.error('Error in handleBuildingComplete:', error);
      addNotification('Failed to complete building construction', 'error');
    }
  }, [
    coins, 
    grid, 
    addNotification,
    addToCoinHistory,
    calculateEnergyUsage
  ]);

  const handleBuildingManage = (building: Building, index: number) => {
    setShowBuildingInfo({ building, index });
  };

  const handleDeleteBuilding = (index: number) => {
    const buildingToDelete = grid[index];
    const updatedGrid = [...grid];
    updatedGrid[index] = null;
    
    setGrid(updatedGrid);
    
    setRecentEvents(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Removed ${buildingToDelete.name}`,
        vitalityImpact: 0,
        coinImpact: Math.floor(buildingToDelete.cost! * 0.5),
        day: day
      }
    ]);
    
    setCoins(coins + Math.floor(buildingToDelete.cost! * 0.5));
    
    addNotification(`Demolished ${buildingToDelete.name} for ${Math.floor(buildingToDelete.cost! * 0.5)} coins`, 'info');
    saveGame();
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

  const handleEndDay = async () => {
    let hourlyIncome = buildings.reduce((sum, building) => {
      return sum + (building?.income || 0);
    }, 0);
    
    hourlyIncome = Math.floor(hourlyIncome * (1 + (level * 0.05)));
    
    setCoins(prev => prev + hourlyIncome + hourlyCoinBonus);
    
    const timestamp = Date.now();
    
    setCoinHistory(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        day,
        balance: coins + hourlyIncome + hourlyCoinBonus,
        amount: hourlyIncome + hourlyCoinBonus,
        type: 'income',
        description: 'Daily income',
        timestamp
      }
    ]);
    
    setDay(prevDay => prevDay + 1);
    setRecentEvents([]);
    setShowWeatherForecast(false);
    
    if ((day + 1) % 5 === 0) {
      generateEnergyBill();
    }
    
    setDaysUntilBill(prev => {
      const days = ((day + 1) % 5);
      return days === 0 ? 5 : days;
    });
    
    checkForRandomEvent();
    
    checkAchievements();
    
    checkForNewUnlocks();
    
    saveGame();
    
    setSelectedBuilding(null);
    setSelectedTile(null);
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
    setCoins(prevCoins => prevCoins + option.coins);
    
    setRecentEvents(prevEvents => [
      ...prevEvents,
      {
        id: crypto.randomUUID(),
        name: option.outcome,
        vitalityImpact: 0,
        coinImpact: option.coins,
        day
      }
    ]);
    
    if (option.neighborEffects && option.neighborEffects.length > 0) {
      const updatedNeighbors = [...neighbors];
      
      option.neighborEffects.forEach(effect => {
        const neighborIndex = updatedNeighbors.findIndex(n => 
          effect.neighborId !== undefined && n.id === effect.neighborId);
        
        if (neighborIndex !== -1) {
          updatedNeighbors[neighborIndex] = {
            ...updatedNeighbors[neighborIndex],
          };
        }
      });
      
      setNeighbors(updatedNeighbors);
    }
    
    addNotification(option.outcome, option.coins > 0 ? 'success' : 'warning');
    setCurrentEvent(null);
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
  
  const handleChangeTimeSpeed = (speed: 1 | 2 | 3) => {
    setTimeSpeed(speed);
  };

  const handleTimeChange = (newTime: number, newTimeOfDay: TimeOfDay) => {
    setGameTime(newTime);
    setTimeOfDay(newTimeOfDay);
    
    if (onTimeChange) {
      onTimeChange(newTimeOfDay);
    }
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
      addNotification(`${neighbor.name} moved into house #${numericHouseIndex}`, 'success');
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
    saveGame();
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
            shouldUnlock = true;
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
            addNotification('Neighborhood bonus applied!', 'success');
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

  const handleLogout = () => {
    setPlayerName("");
    localStorage.removeItem('neighborville_playerName');
    setShowAuthModal(true);
  };

  const handleSaveGame = () => {
    saveGameCallback(undefined, false);
  };

  const handleCollectIncomeWrapper = () => {
    if (showBuildingInfo) {
      handleCollectIncome(showBuildingInfo.index, showBuildingInfo.building.income || 0);
    }
  };
  
  const handleUpgradeBuildingWrapper = (buildingId: string, gridIndex: number, upgradeId: string) => {
    const building = grid[gridIndex];
    if (building) {
      handleUpgradeBuilding(building, [upgradeId]);
    }
  };

  const saveGame = () => {
  };

  const getSeasonalBonus = (building: Building) => {
    return { incomeBonus: 0, energyBonus: 0 };
  };

  const [showSettings, setShowSettings] = useState(false);

  return (
    <AppLayout 
      header={
        <div>
                      <GameHeader
              playerName={playerName}
              coins={coins}
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
              onShowSettings={() => setShowSettings(true)}
              onShowTutorial={() => setShowTutorial(true)}
              onShowAchievements={() => setShowAchievements(true)}
                          onToggleTimePause={toggleTimePause}
            onTimeChange={handleTimeChange}
            timeSpeed={timeSpeed}
            onChangeTimeSpeed={handleChangeTimeSpeed}
              onShowCalendar={() => setShowCalendar(true)}
              onToggleWeatherForecast={() => setShowWeatherForecast(!showWeatherForecast)}
              onShowCoinHistory={() => setShowCoinHistory(true)}
              onPlayerNameClick={handlePlayerNameClick}
              autoSaving={autoSaving}
              lastSaveTime={lastSaveTime}
              onProfileClick={() => setShowProfileModal(true)}
              isMusicPlaying={musicEnabled}
              onToggleMusic={toggleMusic}
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
                if (updates.experience !== undefined) setExperience(updates.experience);
                if (updates.day !== undefined) setDay(updates.day);
                if (updates.gameTime !== undefined) setGameTime(updates.gameTime);
                if (updates.totalEnergyUsage !== undefined) setTotalEnergyUsage(updates.totalEnergyUsage);
              }}
              playerLevel={level}
              gameProgress={{
                playerName,
                coins,
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
              <SpecialEventsManager
                gameData={{
                  playerName,
                  coins,
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
          {showAchievementUnlock && (
            <AchievementUnlockModal 
              achievement={showAchievementUnlock}
              onClose={() => setShowAchievementUnlock(null)}
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
          {showBuildingInfo && (
            <BuildingInfoModal 
              building={showBuildingInfo.building}
              gridIndex={showBuildingInfo.index}
              neighbors={neighbors}
              onClose={() => setShowBuildingInfo(null)}
              onAssignResident={handleAssignResident}
              onRemoveResident={handleRemoveResident}
              onCollectIncome={handleCollectIncomeWrapper}
              onMoveBuilding={handleMoveBuilding}
              onUpgradeBuilding={handleUpgradeBuildingWrapper}
              onSellBuilding={handleDemolishBuilding}
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
            onClose={() => {
              if (isAuthenticated && user?.username && !user.username.includes('@')) {
                setShowAuthModal(false);
              }
            }}
            onLogin={handleLogin}
          />
        )}

        {showPublicProfile && selectedProfile && (
          <PublicProfileModal
            onClose={() => setShowPublicProfile(false)}
            profile={selectedProfile}
          />
        )}
        
        <AnimatePresence>
          {showNeighborList && (
            <NeighborListModal
              neighbors={neighbors}
              onClose={() => setShowNeighborList(false)}
            />
          )}
        </AnimatePresence>
        
        {showLeaderboard && (
          <Leaderboard
            onClose={() => setShowLeaderboard(false)}
            onViewProfile={handleViewProfile}
          />
        )}

        <AnimatePresence>
          {currentEvent && (
            <EventModal
              event={currentEvent}
              onOptionSelect={handleEventOption}
            />
          )}
        </AnimatePresence>
      </AppLayout>
    );
  }