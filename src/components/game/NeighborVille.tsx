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
import BudgetAndCoinModal from "./BudgetAndCoinModal";
import NotificationSystem from "./NotificationSystem";
import type { ExtendedNotification } from "./NotificationSystem";
import PlotExpansion from "./PlotExpansion";
import ProgressBar from "./ProgressBar";
import ResidentAssignment from "./ResidentAssignment";
import TimeBonus from "./TimeBonus";
import { getRandomEvent } from "../../data/events";
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
import { DEFAULT_TAX_POLICIES, calculateCityBudget, updateTaxPolicy, toggleTaxPolicy, DEFAULT_SERVICE_BUDGETS, calculateCityBudgetSystem } from "../../data/taxPolicies";
import ContinueModal from "./ContinueModal";
import GameLayout from "../ui/GameLayout";
import GlassCard from "../ui/GlassCard";
import BuildingUpgradesModal from "./BuildingUpgradesModal";
import ProductionIntegration from "./ProductionIntegration";
import AuthModal from "../auth/AuthModal";
import Leaderboard from "../profile/Leaderboard";
import Dropdown from "../ui/Dropdown";
import BuildingOption from "./BuildingOption";
import type { 
  Building, 
  GameProgress, 
  TimeOfDay, 
  WeatherType,
  PowerGrid,
  WaterGrid,
  Neighbor,
  Bill,
  GameEvent,
  RecentEvent,
  Achievement,
  CoinHistoryEntry,
  EventOption,
  TaxPolicy,
  CityBudget,
  PlayerResources,
  ProductionQueueItem
} from "../../types/game";
import { ALL_BUILDINGS as initialBuildings, getBuildingsByCategory } from "../../data/buildings";
import { neighborProfiles } from "../../data/neighbors";
import { ACHIEVEMENTS } from "../../data/achievements";
import { createDefaultPlayerResources, getResourceById, getRecipeById } from "../../data/resources";
import { useAuth } from "../../context/AuthContext";
import AppLayout from "../ui/AppLayout";

type ProductionQueues = Map<number, ProductionQueueItem[]>;

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

  const [productionQueues, setProductionQueues] = useState<ProductionQueues>(new Map());

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

  const [powerGrid, setPowerGrid] = useState<PowerGrid>({
    totalPowerProduction: 0,
    totalPowerConsumption: 0,
    connectedBuildings: [],
    powerOutages: []
  });

  const [waterGrid, setWaterGrid] = useState<WaterGrid>({
    totalWaterProduction: 0,
    totalWaterConsumption: 0,
    connectedBuildings: [],
    waterShortages: []
  });

  const [buildingCategory, setBuildingCategory] = useState<'all' | 'residential' | 'commercial' | 'utility' | 'entertainment' | 'production'>('all');
  const [buildingSearchTerm, setBuildingSearchTerm] = useState('');
  const [musicEnabled, setMusicEnabled] = useState<boolean | null>(null);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showSocialFeed, setShowSocialFeed] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [wasManuallyPaused, setWasManuallyPaused] = useState(false);

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
  const [seenAchievements, setSeenAchievements] = useState<string[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [taxPolicies, setTaxPolicies] = useState<TaxPolicy[]>(DEFAULT_TAX_POLICIES);
  const [cityBudget, setCityBudget] = useState<CityBudget>({
    totalRevenue: 0,
    totalExpenses: 0,
    maintenanceCosts: 0,
    taxRevenue: 0,
    buildingIncome: 0,
    balance: 0,
    dailyBalance: 0,
    emergencyFund: 0,
    budgetHealth: 'fair'
  });
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
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [coinHistory, setCoinHistory] = useState<CoinHistoryEntry[]>([]);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(false);
  const [showSpecialEvents, setShowSpecialEvents] = useState(false);
  const [showProductionManager, setShowProductionManager] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [activeSeasonalEvents, setActiveSeasonalEvents] = useState<any[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [playerResources, setPlayerResources] = useState<PlayerResources>({});

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
      neighborProgress: neighbors.reduce((progress, neighbor) => {
        progress[neighbor.id.toString()] = {
          unlocked: neighbor.unlocked || false,
          hasHome: neighbor.hasHome || false,
          houseIndex: neighbor.houseIndex,
          satisfaction: neighbor.satisfaction
        };
        return progress;
      }, {} as { [neighborId: string]: { unlocked: boolean; hasHome: boolean; houseIndex?: number; satisfaction?: number } }),
      completedAchievements: achievements.filter(a => a.completed).map(a => a.id),
      seenAchievements: seenAchievements,
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
      waterGrid,
      taxPolicies,
      cityBudget,
      playerResources,
      productionQueues: (() => {
        const queuesObj: { [buildingIndex: string]: ProductionQueueItem[] } = {};
        productionQueues.forEach((queue, buildingIndex) => {
          queuesObj[buildingIndex.toString()] = queue;
        });
        return queuesObj;
      })(),
      xpHistory: [],
      saveTimestamp: Date.now()
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
      achievements, gameTime, gameMinutes, timeOfDay, recentEvents, bills, 
      energyRate, totalEnergyUsage, lastBillDay, coinHistory, weather, powerGrid, waterGrid, 
      taxPolicies, cityBudget, playerResources, productionQueues, user]);

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

    const defaultResources = createDefaultPlayerResources();
    const resourcesObject: PlayerResources = {};
    defaultResources.forEach((quantity, resourceId) => {
      resourcesObject[resourceId] = quantity;
    });
    setPlayerResources(resourcesObject);

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

  const loadGameStateRef = useRef((state: GameProgress, forceReload: boolean = false) => {
    if (initFlags.current.gameStateLoaded && !forceReload) {
      console.log('Game state already loaded, skipping');
      return;
    }

    console.log('Loading game state:', state.playerName, forceReload ? '(forced reload)' : '(initial load)');

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
      },
      taxPolicies: state.taxPolicies || DEFAULT_TAX_POLICIES,
      cityBudget: state.cityBudget || {
        totalRevenue: 0,
        totalExpenses: 0,
        maintenanceCosts: 0,
        taxRevenue: 0,
        buildingIncome: 0,
        balance: 0,
        dailyBalance: 0,
        emergencyFund: 0,
        budgetHealth: 'fair' as const
      },
      playerResources: state.playerResources || (() => {
        const defaultResources = createDefaultPlayerResources();
        const resourcesObject: PlayerResources = {};
        defaultResources.forEach((quantity, resourceId) => {
          resourcesObject[resourceId] = quantity;
        });
        return resourcesObject;
      })()
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
    setTaxPolicies(batchedUpdates.taxPolicies);
    setCityBudget(batchedUpdates.cityBudget);
    setPlayerResources(batchedUpdates.playerResources);

    if (state.productionQueues) {
      console.log(`🔄 LOADING PRODUCTION QUEUES:`, state.productionQueues);
      const loadedQueues = new Map<number, ProductionQueueItem[]>();
      Object.entries(state.productionQueues).forEach(([buildingIndexStr, queue]) => {
        const buildingIndex = parseInt(buildingIndexStr);
        loadedQueues.set(buildingIndex, queue);
        console.log(`   📋 Loaded queue for building ${buildingIndex}:`, queue);
      });
      setProductionQueues(loadedQueues);
      console.log(`✅ Production queues loaded:`, Array.from(loadedQueues.entries()));
    } else {
      console.log(`❌ No production queues in save data`);
      setProductionQueues(new Map());
    }

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

    const loadedAchievements = ACHIEVEMENTS.map(baseAchievement => ({
      ...baseAchievement,
      completed: state.completedAchievements?.includes(baseAchievement.id) || false
    }));

    setAchievements(loadedAchievements);

    if (state.seenAchievements) {
      setSeenAchievements(state.seenAchievements);
    }

    gameTimeRef.current = savedGameTime;

    if (!initFlags.current.gameStateLoaded) {
      initFlags.current.gameStateLoaded = true;
    }

    if (forceReload) {
      addNotification(`Loaded save: ${state.playerName} (Day ${state.day})`, 'success');
    }

    console.log(`Game loaded with time ${savedGameTime}:00, ready for weather generation`);
  });

  const gameTimeRef = useRef<number>(8);

  const loadGameState = (state: GameProgress, forceReload: boolean = false) => {
    if (!state) return;
    loadGameStateRef.current(state, forceReload);
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
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);

      if (!isVisible) {
        setWasManuallyPaused(timePaused);
        if (!timePaused) {
          setTimePaused(true);
          addNotification("Game auto-paused - tab not visible", "info", true);
        }
      } else {
        if (timePaused && !wasManuallyPaused) {
          setTimePaused(false);
          addNotification("Game resumed - welcome back!", "success", true);
        }
        setWasManuallyPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timePaused, wasManuallyPaused, addNotification]);

  useEffect(() => {
    if (!timePaused) {
      const timer = setInterval(() => {
        setGameMinutes(prevMinutes => {
          const newMinutes = prevMinutes + timeSpeed;
          if (newMinutes >= 60) {
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

            return newMinutes - 60;
          }
          return newMinutes;
        });
      }, 1000 / timeSpeed);

      return () => clearInterval(timer);
    }
  }, [timePaused, gameTime, onTimeChange, timeSpeed]);

  useEffect(() => {
    if (!timePaused) {
      const autoProductionTimer = setInterval(() => {
        const currentGameTime = gameTime * 60 + gameMinutes;

        setProductionQueues(prevQueues => {
          const updatedQueues = new Map(prevQueues);
          let hasUpdates = false;

          updatedQueues.forEach((queue, buildingIndex) => {
            const updatedQueue = queue.map(item => {
              if (item.status === 'queued') {
                const activeItems = queue.filter(q => q.status === 'active');
                if (activeItems.length === 0) {
                  const newItem = {
                    ...item,
                    status: 'active' as const,
                    startTime: currentGameTime,
                    endTime: currentGameTime + (item.endTime - item.startTime)
                  };
                  hasUpdates = true;
                  return newItem;
                }
                return item;
              } else if (item.status === 'active') {
                const totalDuration = item.endTime - item.startTime;
                const elapsed = currentGameTime - item.startTime;
                const progress = Math.min(100, (elapsed / totalDuration) * 100);

                if (progress >= 100) {
                  hasUpdates = true;

                  addNotification(`Production completed at building ${buildingIndex}!`, 'success', true);

                  return {
                    ...item,
                    status: 'completed' as const,
                    progress: 100
                  };
                } else if (Math.abs(progress - item.progress) > 1) {
                  hasUpdates = true;
                  return {
                    ...item,
                    progress
                  };
                }
                return item;
              }
              return item;
            });

            const filteredQueue = updatedQueue.filter(item => {
              if (item.status === 'completed') {
                const completionTime = item.endTime;
                if (currentGameTime - completionTime > 5) {
                  hasUpdates = true;
                  return false;
                }
              }
              return true;
            });

            if (hasUpdates) {
              updatedQueues.set(buildingIndex, filteredQueue);
            }
          });

          return hasUpdates ? updatedQueues : prevQueues;
        });

        setGrid(prevGrid => {
          const updatedGrid = [...prevGrid];
          let hasProduction = false;

          updatedGrid.forEach((building, index) => {
            if (!building || !building.produces || building.produces.length === 0) return;

            if (!building.nextProductionTime) {
              const fastestProduction = Math.min(...building.produces.map(p => p.timeMinutes));
              building.nextProductionTime = currentGameTime + fastestProduction;
              building.lastProductionCheck = currentGameTime;
              hasProduction = true;
              return;
            }

            if (currentGameTime >= building.nextProductionTime) {
              building.produces.forEach(production => {
                const resourceAmount = production.quantity;

                setPlayerResources(prevResources => {
                  const newResources = { ...prevResources };
                  if (newResources[production.resourceId] !== undefined) {
                    newResources[production.resourceId] += resourceAmount;
                  } else {
                    newResources[production.resourceId] = resourceAmount;
                  }
                  return newResources;
                });

                addNotification(`${building.name} produced ${resourceAmount} ${production.resourceId}`, 'success', true);
              });

              const nextProductionDelay = Math.min(...building.produces.map(p => p.timeMinutes));
              updatedGrid[index] = {
                ...building,
                lastProductionCheck: currentGameTime,
                nextProductionTime: currentGameTime + nextProductionDelay
              };

              hasProduction = true;
            }
          });

          return hasProduction ? updatedGrid : prevGrid;
        });
      }, 1000);

      return () => clearInterval(autoProductionTimer);
    }
  }, [timePaused, gameTime, gameMinutes, addNotification, setPlayerResources]);

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

  const addToProductionQueue = useCallback((buildingIndex: number, recipeId: string, duration: number) => {
    const currentGameTime = gameTime * 60 + gameMinutes;
    const adjustedDuration = Math.ceil(duration / timeSpeed);

    const newItem: ProductionQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      recipeId,
      buildingIndex,
      startTime: currentGameTime,
      endTime: currentGameTime + adjustedDuration,
      status: 'active',
      progress: 0
    };

    console.log(`🚀 ADDING TO PRODUCTION QUEUE:`);
    console.log(`   Building: ${buildingIndex}`);
    console.log(`   Recipe: ${recipeId}`);
    console.log(`   Duration: ${duration} minutes (${adjustedDuration} at ${timeSpeed}x speed)`);
    console.log(`   Start time: ${currentGameTime} (${gameTime}:${gameMinutes.toString().padStart(2, '0')})`);
    console.log(`   End time: ${currentGameTime + adjustedDuration}`);
    console.log(`   Item:`, newItem);

    setProductionQueues(prev => {
      const updated = new Map(prev);
      const currentQueue = updated.get(buildingIndex) || [];

      const hasActiveProduction = currentQueue.some(item => item.status === 'active');
      if (hasActiveProduction) {
        newItem.status = 'queued';
        console.log(`   📋 Setting status to 'queued' because building ${buildingIndex} already has active production`);
      } else {
        console.log(`   ▶️ Setting status to 'active' - building ${buildingIndex} is available`);
      }

      updated.set(buildingIndex, [...currentQueue, newItem]);

      console.log(`📋 Updated queue for building ${buildingIndex}:`, updated.get(buildingIndex));
      console.log(`🏭 Total production queues:`, Array.from(updated.entries()));

      return updated;
    });

    let productionName: string;
    if (recipeId.startsWith('extract_')) {
      const resourceId = recipeId.replace('extract_', '');
      const resource = getResourceById(resourceId);
      productionName = `Extract ${resource?.name || resourceId}`;
    } else {
      const recipe = getRecipeById(recipeId);
      productionName = recipe?.name || recipeId;
    }

    addNotification(
      `Started production: ${productionName} (${adjustedDuration}m at ${timeSpeed}x speed)`, 
      'success', 
      true
    );
  }, [gameTime, gameMinutes, timeSpeed, addNotification]);

  const cancelProductionItem = useCallback((buildingIndex: number, itemId: string) => {
    setProductionQueues(prev => {
      const updated = new Map(prev);
      const currentQueue = updated.get(buildingIndex) || [];
      const filteredQueue = currentQueue.filter(item => item.id !== itemId);

      if (filteredQueue.length === 0) {
        updated.delete(buildingIndex);
      } else {
        updated.set(buildingIndex, filteredQueue);
      }

      return updated;
    });

    addNotification(`Canceled production item`, 'info', true);
  }, [addNotification]);

  const getProductionQueueForBuilding = useCallback((buildingIndex: number) => {
    return productionQueues.get(buildingIndex) || [];
  }, [productionQueues]);

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

      const buildingWithProductionState = { ...building };
      if (building.produces && building.produces.length > 0) {
        const currentGameTime = gameTime * 60 + gameMinutes;

        const fastestProduction = Math.min(...building.produces.map(p => p.timeMinutes));
        buildingWithProductionState.lastProductionCheck = currentGameTime;
        buildingWithProductionState.nextProductionTime = currentGameTime + fastestProduction;
        console.log(`Initialized production for ${building.name}. Current time:`, currentGameTime, 'Next production at:', currentGameTime + fastestProduction);
      }

      newGrid[index] = buildingWithProductionState;

      const newCoins = coins - building.cost;

      setGrid(newGrid);
      setCoins(newCoins);

      setSelectedBuilding(null);
      setSelectedTile(null);

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
    gameTime,
    gameMinutes,
    addNotification,
    addToCoinHistory,
    calculateEnergyUsage
  ]);

  const handleXPGain = useCallback((amount: number, source: string, description: string) => {
    setExperience(prev => prev + amount);
    addNotification(`+${amount} XP from ${source}: ${description}`, 'success');
  }, [addNotification]);

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
      communitySatisfaction: upgradedStats.communitySatisfaction,
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

    const gridBuildings = grid.filter(building => building !== null);
    const updatedCityBudget = calculateCityBudget(gridBuildings, taxPolicies);
    const taxRevenue = updatedCityBudget.taxRevenue;

    setCityBudget(updatedCityBudget);

    const totalDailyIncome = hourlyIncome + hourlyCoinBonus + taxRevenue;

    setCoins(prev => prev + totalDailyIncome);

    const timestamp = Date.now();

    const newCoinHistory = [];

    if (hourlyIncome > 0) {
      newCoinHistory.push({
        id: crypto.randomUUID(),
        day,
        balance: coins + hourlyIncome,
        amount: hourlyIncome,
        type: 'income' as const,
        description: 'Building income',
        timestamp
      });
    }

    if (taxRevenue > 0) {
      newCoinHistory.push({
        id: crypto.randomUUID(),
        day,
        balance: coins + hourlyIncome + taxRevenue,
        amount: taxRevenue,
        type: 'income' as const,
        description: 'Tax revenue',
        timestamp: timestamp + 1
      });
    }

    if (hourlyCoinBonus > 0) {
      newCoinHistory.push({
        id: crypto.randomUUID(),
        day,
        balance: coins + totalDailyIncome,
        amount: hourlyCoinBonus,
        type: 'income' as const,
        description: 'Daily bonus',
        timestamp: timestamp + 2
      });
    }

    setCoinHistory(prev => [...prev, ...newCoinHistory]);

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

  const updateNeighborSatisfaction = () => {
    const updatedNeighbors = neighbors.map(neighbor => {
      if (!neighbor.unlocked || !neighbor.hasHome) return neighbor;

      let satisfactionChange = 0;
      let reasons = [];

      const house = neighbor.houseIndex !== undefined ? grid[neighbor.houseIndex] : null;
      if (house) {
        if (neighbor.housingPreference === 'house' && house.id === 'apartment') {
          satisfactionChange -= 25;
          reasons.push('Prefers house over apartment (-25)');
        } else if (neighbor.housingPreference === 'apartment' && house.id === 'house') {
          satisfactionChange -= 15;
          reasons.push('Prefers apartment over house (-15)');
        }

        if (house.occupants && house.occupants.length > (neighbor.maxNeighbors || 1)) {
          satisfactionChange -= 30;
          reasons.push('Too many roommates (-30)');
        }

        if (house.needsElectricity && !house.isConnectedToPower) {
          satisfactionChange -= 40;
          reasons.push('No electricity (-40)');
        }

        if (house.needsWater && !house.isConnectedToWater) {
          satisfactionChange -= 35;
          reasons.push('No water (-35)');
        }
      }

      grid.forEach(building => {
        if (building) {
          if (neighbor.likes && Array.isArray(neighbor.likes)) {
            if (neighbor.likes.some(like => building.name.toLowerCase() === like.toLowerCase())) {
              if (!building.needsElectricity || building.isConnectedToPower) {
                if (!building.needsWater || building.isConnectedToWater) {
                  satisfactionChange += 20;
                  reasons.push(`Likes ${building.name} (+20)`);
                }
              }
            }
          } else if (neighbor.likes && typeof neighbor.likes === 'string') {
            if (building.name.toLowerCase() === neighbor.likes.toLowerCase()) {
              if (!building.needsElectricity || building.isConnectedToPower) {
                if (!building.needsWater || building.isConnectedToWater) {
                  satisfactionChange += 20;
                  reasons.push(`Likes ${building.name} (+20)`);
                }
              }
            }
          }

          if (neighbor.dislikes && Array.isArray(neighbor.dislikes)) {
            if (neighbor.dislikes.some(dislike => building.name.toLowerCase() === dislike.toLowerCase())) {
              satisfactionChange -= 25;
              reasons.push(`Dislikes ${building.name} (-25)`);
            }
          } else if (neighbor.dislikes && typeof neighbor.dislikes === 'string') {
            if (building.name.toLowerCase() === neighbor.dislikes.toLowerCase()) {
              satisfactionChange -= 25;
              reasons.push(`Dislikes ${building.name} (-25)`);
            }
          }
        }
      });

      const weatherBonus = getWeatherHappinessEffect();
      satisfactionChange += weatherBonus;
      if (weatherBonus !== 0) {
        reasons.push(`Weather: ${weather} (${weatherBonus > 0 ? '+' : ''}${weatherBonus})`);
      }

      const newSatisfaction = Math.min(100, Math.max(0, (neighbor.satisfaction || 70) + satisfactionChange));

      if (newSatisfaction < 20 && (neighbor.satisfaction || 70) >= 20) {
        addNotification(`${neighbor.name} is extremely dissatisfied and might leave! ${reasons.join('. ')}`, 'error');
      } else if (newSatisfaction < 40 && (neighbor.satisfaction || 70) >= 40) {
        addNotification(`${neighbor.name} is very dissatisfied! ${reasons.join('. ')}`, 'warning');
      }

      if (newSatisfaction < 10) {
        handleRemoveResident(neighbor.id);
        addNotification(`${neighbor.name} has left your neighborhood due to poor living conditions!`, 'error');
        return {
          ...neighbor,
          satisfaction: 60,
          hasHome: false,
          houseIndex: undefined
        };
      }

      return {
        ...neighbor,
        satisfaction: newSatisfaction
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
    const newPauseState = !timePaused;
    setTimePaused(newPauseState);

    if (newPauseState && !isTabVisible) {
      setWasManuallyPaused(true);
    }

    if (!newPauseState) {
      setWasManuallyPaused(false);
    }
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
    let filteredBuildings = buildings;

    if (buildingCategory !== 'all') {
      const categoryBuildings = getBuildingsByCategory(buildingCategory);
      const categoryBuildingIds = new Set(categoryBuildings.map(b => b.id));
      filteredBuildings = buildings.filter(building => categoryBuildingIds.has(building.id));
    }

    if (buildingSearchTerm.trim()) {
      const searchLower = buildingSearchTerm.toLowerCase();
      filteredBuildings = filteredBuildings.filter(building => 
        building.name.toLowerCase().includes(searchLower) ||
        building.description?.toLowerCase().includes(searchLower) ||
        building.type?.toLowerCase().includes(searchLower)
      );
    }

    filteredBuildings = filteredBuildings.sort((a, b) => {
      const aIsLocked = a.levelRequired && level < a.levelRequired;
      const bIsLocked = b.levelRequired && level < b.levelRequired;

      if (aIsLocked && !bIsLocked) return 1;
      if (!aIsLocked && bIsLocked) return -1;

      return 0;
    });

    return filteredBuildings;
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

  const checkAchievementsInstant = useCallback(() => {
    const updatedAchievements = achievements.map(achievement => {
      if (achievement.completed) return achievement;

      let shouldComplete = false;

      switch (achievement.id) {
        case 'first_building':
          shouldComplete = grid.some(building => building !== null);
          break;
        case 'three_buildings':
          const buildingTypes = new Set(grid.filter(b => b !== null).map(b => b!.id));
          shouldComplete = buildingTypes.size >= 8;
          break;
        case 'day_5':
          shouldComplete = day >= 15;
          break;
        case 'day_10':
          shouldComplete = day >= 30;
          break;
        case 'day_30':
          shouldComplete = day >= 75;
          break;
        case 'coins_3000':
          shouldComplete = coins >= 8000;
          break;
        case 'coins_5000':
          shouldComplete = coins >= 20000;
          break;
        case 'coins_10000':
          shouldComplete = coins >= 50000;
          break;
        case 'expand_plot':
          shouldComplete = gridSize >= 36;
          break;
        case 'unlock_neighbor':
          shouldComplete = neighbors.filter(n => n.unlocked && n.unlockCondition !== null).length >= 3;
          break;
        case 'five_neighbors':
          shouldComplete = neighbors.filter(n => n.unlocked).length >= 12;
          break;
        case 'full_grid':
          shouldComplete = gridSize >= 64 && grid.slice(0, 64).every(tile => tile !== null);
          break;
        case 'level_2':
          shouldComplete = level >= 3;
          break;
        case 'level_5':
          shouldComplete = level >= 8;
          break;
        case 'level_10':
          shouldComplete = level >= 15;
          break;
        case 'max_expansion':
          shouldComplete = gridSize >= 64;
          break;
        case 'ten_residents':
          shouldComplete = neighbors.filter(n => n.hasHome).length >= 25;
          break;
        case 'power_system':
          const connectedPowerBuildings = grid.filter(b => b && b.isConnectedToPower).length;
          shouldComplete = connectedPowerBuildings >= 15;
          break;
        case 'water_system':
          const connectedWaterBuildings = grid.filter(b => b && b.isConnectedToWater).length;
          shouldComplete = connectedWaterBuildings >= 15;
          break;
        case 'energy_positive':
          const totalProduction = grid.filter(b => b && b.isPowerGenerator).reduce((sum, b) => sum + (b.powerOutput || 0), 0);
          const totalConsumption = grid.filter(b => b && b.energyUsage).reduce((sum, b) => sum + (b.energyUsage || 0), 0);
          shouldComplete = totalConsumption > 0 && totalProduction >= (totalConsumption * 3);
          break;
        case 'first_upgrade':
          shouldComplete = grid.filter(b => b && b.currentUpgrades && b.currentUpgrades.length > 0).length >= 5;
          break;
        case 'five_upgrades':
          const totalUpgrades = grid.reduce((sum, b) => sum + (b?.currentUpgrades?.length || 0), 0);
          shouldComplete = totalUpgrades >= 15;
          break;

        case 'coin_millionaire':
          shouldComplete = coins >= 100000;
          break;
        case 'day_100':
          shouldComplete = day >= 100;
          break;
        case 'day_365':
          shouldComplete = day >= 365;
          break;
        case 'level_20':
          shouldComplete = level >= 20;
          break;
        case 'mega_community':
          shouldComplete = neighbors.filter(n => n.unlocked).length >= 20;
          break;
        case 'master_builder':
          shouldComplete = grid.filter(b => b !== null).length >= 100;
          break;
        case 'upgrade_master':
          const allUpgrades = grid.reduce((sum, b) => sum + (b?.currentUpgrades?.length || 0), 0);
          shouldComplete = allUpgrades >= 50;
          break;
      }

      if (shouldComplete && !achievement.completed) {
        setExperience(prev => prev + achievement.xpReward);
        addNotification(`🏆 Achievement unlocked: ${achievement.title}! (+${achievement.xpReward} XP)`, 'success');

        const updatedAchievement = {
          ...achievement,
          completed: true
        };

        if (!seenAchievements.includes(achievement.id)) {
          setShowAchievementUnlock(updatedAchievement);
        }

        return updatedAchievement;
      }

      return achievement;
    });

    setAchievements(updatedAchievements);
  }, [achievements, grid, day, coins, gridSize, neighbors, level, seenAchievements, addNotification]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAchievementsInstant();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [coins, level, gridSize, grid, neighbors, day]);

  useEffect(() => {
    if (timePaused) return;

    const interval = setInterval(() => {
      const currentGameTime = gameTime * 60 + gameMinutes;

      const updatedGrid = [...grid];
      let resourcesChanged = false;
      const newResources = { ...playerResources };

      updatedGrid.forEach((building, index) => {
        if (building && building.produces && building.produces.length > 0) {
          const nextProductionTime = building.nextProductionTime || 0;

          if (currentGameTime >= nextProductionTime) {
            building.produces.forEach(production => {
              const resourceId = production.resourceId;
              const quantity = production.quantity;

              newResources[resourceId] = (newResources[resourceId] || 0) + quantity;
              resourcesChanged = true;

              const resource = getResourceById(resourceId);
              addNotification(
                `${building.name} produced ${quantity} ${resource?.name || resourceId}!`,
                'success'
              );
            });

            const productionTime = building.produces[0].timeMinutes;
            const adjustedProductionTime = Math.ceil(productionTime / timeSpeed);
            updatedGrid[index] = {
              ...building,
              lastProductionCheck: currentGameTime,
              nextProductionTime: currentGameTime + adjustedProductionTime
            };

            console.log(`Production completed at building ${index}!`);
          }
        }
      });

      if (resourcesChanged) {        setPlayerResources(newResources);
        setGrid(updatedGrid);
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [timePaused, gameTime, gameMinutes, grid, playerResources, timeSpeed, addNotification]);

  useEffect(() => {
    if (timePaused) return;

    const interval = setInterval(() => {
      const currentGameTime = gameTime * 60 + gameMinutes;
      console.log(`🏭 PRODUCTION CHECK: Current game time: ${currentGameTime} minutes (${gameTime}:${gameMinutes.toString().padStart(2, '0')})`);

      const updatedQueues = new Map(productionQueues);
      let resourcesChanged = false;
      let queuesChanged = false;
      const newResources = { ...playerResources };

      let totalActiveProductions = 0;
      productionQueues.forEach((queue, buildingIndex) => {
        const activeItems = queue.filter(item => item.status === 'active');
        if (activeItems.length > 0) {
          totalActiveProductions += activeItems.length;
          activeItems.forEach(item => {
            const timeRemaining = item.endTime - currentGameTime;
            const progress = Math.min(100, ((currentGameTime - item.startTime) / (item.endTime - item.startTime)) * 100);
            console.log(`🔧 Building ${buildingIndex}: ${item.recipeId} - ${progress.toFixed(1)}% complete, ${timeRemaining.toFixed(1)} minutes remaining`);
          });
        }
      });

      if (totalActiveProductions > 0) {
        console.log(`🏭 Total active productions: ${totalActiveProductions}`);
      }

      updatedQueues.forEach((queue, buildingIndex) => {
        const completedItems: string[] = [];

        queue.forEach((item) => {
          if (item.status === 'active' && currentGameTime >= item.endTime) {
            console.log(`✅ PRODUCTION COMPLETING: Building ${buildingIndex}, Recipe ${item.recipeId}`);

            let outputs: { resourceId: string; quantity: number }[] = [];
            let xpReward = 0;
            let productionName = '';

            if (item.recipeId.startsWith('extract_')) {
              const resourceId = item.recipeId.replace('extract_', '');
              const building = grid[buildingIndex];
              if (building?.produces) {
                const production = building.produces.find(p => p.resourceId === resourceId);
                if (production) {
                  outputs = [{ resourceId: production.resourceId, quantity: production.quantity }];
                  xpReward = Math.ceil(production.quantity / 2);
                  const resource = getResourceById(resourceId);
                  productionName = `Extract ${resource?.name || resourceId}`;
                  console.log(`🌲 Found auto-production:`, production);
                } else {
                  console.error(`❌ Auto-production not found for resourceId: ${resourceId}`);
                }
              } else {
                console.error(`❌ Building has no produces array: ${building?.name}`);
              }
            } else {
              const recipe = getRecipeById(item.recipeId);
              if (recipe) {
                outputs = recipe.outputs;
                xpReward = recipe.xpReward;
                productionName = recipe.name;
                console.log(`📦 Found recipe:`, recipe);
              } else {
                console.error(`❌ Recipe not found: ${item.recipeId}`);
              }
            }

            if (outputs.length > 0) {
              outputs.forEach(output => {
                const oldAmount = newResources[output.resourceId] || 0;
                newResources[output.resourceId] = oldAmount + output.quantity;
                resourcesChanged = true;
                console.log(`💰 Added ${output.quantity} ${output.resourceId} (${oldAmount} -> ${newResources[output.resourceId]})`);
              });

              handleXPGain(xpReward, 'production', `Completed ${productionName}`);
              console.log(`⭐ Awarded ${xpReward} XP for completing ${productionName}`);

              addNotification(
                `Production completed! Received ${outputs.map(o => `${o.quantity} ${getResourceById(o.resourceId)?.name || o.resourceId}`).join(', ')}`,
                'success'
              );

              completedItems.push(item.id);
              console.log(`🗑️ Marking item ${item.id} for removal`);
            }
          }
        });

        if (completedItems.length > 0) {
          console.log(`🧹 Removing ${completedItems.length} completed items from building ${buildingIndex}`);
          const updatedQueue = queue.filter(item => !completedItems.includes(item.id));

          const nextItem = updatedQueue.find(item => item.status === 'queued');
          if (nextItem) {
            nextItem.status = 'active';
            nextItem.startTime = currentGameTime;

            let productionDuration = 0;
            let productionName = '';

            if (nextItem.recipeId.startsWith('extract_')) {
              const resourceId = nextItem.recipeId.replace('extract_', '');
              const building = grid[buildingIndex];
              if (building?.produces) {
                const production = building.produces.find(p => p.resourceId === resourceId);
                if (production) {
                  productionDuration = Math.ceil(production.timeMinutes / timeSpeed);
                  const resource = getResourceById(resourceId);
                  productionName = `Extract ${resource?.name || resourceId}`;
                }
              }
            } else {
              const recipe = getRecipeById(nextItem.recipeId);
              if (recipe) {
                productionDuration = Math.ceil(recipe.productionTime / timeSpeed);
                productionName = recipe.name;
              }
            }

            if (productionDuration > 0) {
              nextItem.endTime = currentGameTime + productionDuration;
              console.log(`▶️ Started next production: ${productionName} (${productionDuration} minutes at ${timeSpeed}x speed)`);
            }
          }

          updatedQueues.set(buildingIndex, updatedQueue);
          queuesChanged = true;
        }
      });

      if (resourcesChanged) {
        console.log(`💾 Updating resources:`, newResources);
        setPlayerResources(newResources);
      }

      if (queuesChanged) {
        console.log(`🔄 Updating production queues`);
        setProductionQueues(updatedQueues);
      }      if (resourcesChanged || queuesChanged) {
        console.log(`🎯 Production state updated - Resources changed: ${resourcesChanged}, Queues changed: ${queuesChanged}`);
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [timePaused, gameTime, gameMinutes, productionQueues, playerResources, grid, timeSpeed, addNotification, handleXPGain]);

  const handleShowProductionManager = () => {
    console.log(`🏭 OPENING PRODUCTION MODAL - Current production queues:`, Array.from(productionQueues.entries()));

    const availableProductionBuildings = initialBuildings.filter(b => 
      b.productionType || (b.produces && b.produces.length > 0)
    );
    console.log(`📋 Available production buildings:`, availableProductionBuildings.map(b => ({
      id: b.id, 
      name: b.name, 
      productionType: b.productionType, 
      produces: b.produces
    })));

    const placedProductionBuildings = grid
      .map((building, index) => ({ building, index }))
      .filter(({ building }) => building && (
        building.productionType || (building.produces && building.produces.length > 0)
      ));
    console.log(`🏗️ Placed production buildings on grid:`, placedProductionBuildings.map(({ building, index }) => ({
      index, 
      id: building?.id, 
      name: building?.name, 
      productionType: building?.productionType,
      produces: building?.produces
    })));

    setShowProductionManager(true);
  };

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
              playerResources={playerResources}
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
              onShowBudgetModal={() => setShowBudgetModal(true)}
              onPlayerNameClick={handlePlayerNameClick}
              autoSaving={autoSaving}
              lastSaveTime={lastSaveTime}
              onProfileClick={() => setShowProfileModal(true)}
              isMusicPlaying={musicEnabled}
              onToggleMusic={toggleMusic}
              onSaveGame={handleSaveGame}
                                onShowProductionManager={handleShowProductionManager}
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
            <div className="col-span-5 space-y-4">
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
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-emerald-800">Available Buildings</h2>
                      <p className="text-sm text-gray-600 mt-1">Choose from {getCategorizedBuildings().length} available buildings</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Your Level</div>
                        <div className="text-lg font-bold text-emerald-700">{level}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Coins</div>
                        <div className="text-lg font-bold text-yellow-700">{coins.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Filter Buildings</h3>
                      <button 
                        onClick={() => setBuildingCategory('all')}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Clear Filters
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { value: 'all', label: 'All', icon: '🏘️' },
                        { value: 'residential', label: 'Residential', icon: '🏠' },
                        { value: 'commercial', label: 'Commercial', icon: '🏪' },
                        { value: 'utility', label: 'Utility', icon: '⚡' },
                        { value: 'entertainment', label: 'Entertainment', icon: '🎭' },
                        { value: 'production', label: 'Production', icon: '🏭' }
                      ].map((category) => (
                        <button
                          key={category.value}
                          onClick={() => setBuildingCategory(category.value as typeof buildingCategory)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            buildingCategory === category.value
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <div className="text-lg mb-1">{category.icon}</div>
                          <div className="text-xs font-medium">{category.label}</div>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-600">
                        <span className="font-semibold">{getCategorizedBuildings().length}</span> buildings in 
                        <span className="font-semibold text-emerald-600 ml-1">
                          {buildingCategory === 'all' ? 'All Categories' : 
                           buildingCategory.charAt(0).toUpperCase() + buildingCategory.slice(1)}
                        </span>
                      </div>
                      <div className="text-gray-500">
                        Showing {getCategorizedBuildings().filter(b => !b.levelRequired || level >= b.levelRequired).length} unlocked
                      </div>
                    </div>
                  </div>

                  <div 
                    className="overflow-y-auto pr-2 buildings-scroll"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#10b981 #f3f4f6',
                      maxHeight: '450px'
                    }}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {getCategorizedBuildings().map((building) => (
                        <BuildingOption 
                          key={building.id}
                          building={building}
                          isSelected={selectedBuilding?.id === building.id}
                          onSelect={handleBuildingSelect}
                          playerLevel={level}
                          playerCoins={coins}
                          playerResources={playerResources}
                        />
                      ))}
                    </div>

                    {getCategorizedBuildings().length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4">🏗️</div>
                        <div className="text-xl font-semibold mb-2">No buildings available</div>
                        <div className="text-sm">Try selecting a different category or level up to unlock more buildings!</div>
                      </div>
                    )}
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

            <div className="col-span-7">
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
            title="Marketplace"
          >
            🛍️
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShowProductionManager}
            className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full shadow-lg transition-all flex items-center justify-center"
            title="Production Manager"
          >
            🏭
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSpecialEvents(true)}
            className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-full shadow-lg transition-all flex items-center justify-center"
            title="Special Events"
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
            loadGameState(gameData, true);
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
              neighborProgress: neighbors.reduce((progress, neighbor) => {
                progress[neighbor.id.toString()] = {
                  unlocked: neighbor.unlocked || false,
                  hasHome: neighbor.hasHome || false,
                  houseIndex: neighbor.houseIndex,
                  satisfaction: neighbor.satisfaction
                };
                return progress;
              }, {} as { [neighborId: string]: { unlocked: boolean; hasHome: boolean; houseIndex?: number; satisfaction?: number } }),
              completedAchievements: achievements.filter(a => a.completed).map(a => a.id),
              seenAchievements: seenAchievements,
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
              taxPolicies,
              cityBudget,
              playerResources,
              productionQueues: (() => {
                const queuesObj: { [buildingIndex: string]: ProductionQueueItem[] } = {};
                productionQueues.forEach((queue, buildingIndex) => {
                  queuesObj[buildingIndex.toString()] = queue;
                });
                return queuesObj;
              })(),
              xpHistory: [],
              saveTimestamp: Date.now()
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
            neighborProgress: neighbors.reduce((progress, neighbor) => {
              progress[neighbor.id.toString()] = {
                unlocked: neighbor.unlocked || false,
                hasHome: neighbor.hasHome || false,
                houseIndex: neighbor.houseIndex,
                satisfaction: neighbor.satisfaction
              };
              return progress;
            }, {} as { [neighborId: string]: { unlocked: boolean; hasHome: boolean; houseIndex?: number; satisfaction?: number } }),
            completedAchievements: achievements.filter(a => a.completed).map(a => a.id),
            seenAchievements: seenAchievements,
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
            taxPolicies,
            cityBudget,
            playerResources,
            productionQueues: (() => {
              const queuesObj: { [buildingIndex: string]: ProductionQueueItem[] } = {};
              productionQueues.forEach((queue, buildingIndex) => {
                queuesObj[buildingIndex.toString()] = queue;
              });
              return queuesObj;
            })(),
            xpHistory: [],
            saveTimestamp: Date.now()
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
                neighborProgress: neighbors.reduce((progress, neighbor) => {
                  progress[neighbor.id.toString()] = {
                    unlocked: neighbor.unlocked || false,
                    hasHome: neighbor.hasHome || false,
                    houseIndex: neighbor.houseIndex,
                    satisfaction: neighbor.satisfaction
                  };
                  return progress;
                }, {} as { [neighborId: string]: { unlocked: boolean; hasHome: boolean; houseIndex?: number; satisfaction?: number } }),
                completedAchievements: achievements.filter(a => a.completed).map(a => a.id),
                seenAchievements: seenAchievements,
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
                taxPolicies,
                cityBudget,
                playerResources,
                productionQueues: (() => {
                  const queuesObj: { [buildingIndex: string]: ProductionQueueItem[] } = {};
                  productionQueues.forEach((queue, buildingIndex) => {
                    queuesObj[buildingIndex.toString()] = queue;
                  });
                  return queuesObj;
                })(),
                xpHistory: [],
                saveTimestamp: Date.now()
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
                  neighborProgress: neighbors.reduce((progress, neighbor) => {
                    progress[neighbor.id.toString()] = {
                      unlocked: neighbor.unlocked || false,
                      hasHome: neighbor.hasHome || false,
                      houseIndex: neighbor.houseIndex,
                      satisfaction: neighbor.satisfaction
                    };
                    return progress;
                  }, {} as { [neighborId: string]: { unlocked: boolean; hasHome: boolean; houseIndex?: number; satisfaction?: number } }),
                  completedAchievements: achievements.filter(a => a.completed).map(a => a.id),
                  seenAchievements: seenAchievements,
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
                  taxPolicies,
                  cityBudget,
                  playerResources,
                  productionQueues: (() => {
                    const queuesObj: { [buildingIndex: string]: ProductionQueueItem[] } = {};
                    productionQueues.forEach((queue, buildingIndex) => {
                      queuesObj[buildingIndex.toString()] = queue;
                    });
                    return queuesObj;
                  })(),
                  xpHistory: [],
                  saveTimestamp: Date.now()
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
          {showProductionManager && (
            <ProductionIntegration
              onClose={() => {
                console.log(`🚪 CLOSING PRODUCTION MODAL - Current production queues:`, Array.from(productionQueues.entries()));
                setShowProductionManager(false);
              }}
              playerLevel={level}
              onXPGain={handleXPGain}
              playerResources={playerResources}
              setPlayerResources={setPlayerResources}
              grid={grid}
              onUpdateGrid={setGrid}
              gameTime={gameTime}
              gameMinutes={gameMinutes}
              currentGameTimeMinutes={gameTime * 60 + (gameMinutes || 0)}
              timeSpeed={timeSpeed}
              addNotification={addNotification}
              productionQueues={productionQueues}
              onAddToProductionQueue={addToProductionQueue}
              onCancelProductionItem={cancelProductionItem}
              getProductionQueueForBuilding={getProductionQueueForBuilding}
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
              playerResources={playerResources}
              onResourceUpdate={setPlayerResources}
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
                neighborProgress: neighbors.reduce((progress, neighbor) => {
                  progress[neighbor.id.toString()] = {
                    unlocked: neighbor.unlocked || false,
                    hasHome: neighbor.hasHome || false,
                    houseIndex: neighbor.houseIndex,
                    satisfaction: neighbor.satisfaction
                  };
                  return progress;
                }, {} as { [neighborId: string]: { unlocked: boolean; hasHome: boolean; houseIndex?: number; satisfaction?: number } }),
                completedAchievements: achievements.filter(a => a.completed).map(a => a.id),
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
                taxPolicies,
                cityBudget,
                playerResources,
                productionQueues: (() => {
                  const queuesObj: { [buildingIndex: string]: ProductionQueueItem[] } = {};
                  productionQueues.forEach((queue, buildingIndex) => {
                    queuesObj[buildingIndex.toString()] = queue;
                  });
                  return queuesObj;
                })(),
                xpHistory: [],
                saveTimestamp: Date.now()
              }}
              achievements={achievements}
              neighbors={neighbors}
              grid={grid}
              xpHistory={[]}
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
              onClose={() => {
                const achievementIds = Array.isArray(showAchievementUnlock) 
                  ? showAchievementUnlock.map(a => a.id)
                  : [showAchievementUnlock.id];

                setSeenAchievements(prev => [...prev, ...achievementIds.filter(id => !prev.includes(id))]);
                setShowAchievementUnlock(null);
              }}
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

        <AnimatePresence>
          {showBudgetModal && (
            <BudgetAndCoinModal
              coins={coins}
              coinHistory={coinHistory}
              buildings={grid.filter(b => b !== null) as Building[]}
              currentDay={day}
              taxPolicies={taxPolicies}
              serviceBudgets={DEFAULT_SERVICE_BUDGETS}
              infrastructureUpgrades={[]}
              cityBudgetSystem={calculateCityBudgetSystem(
                grid.filter(b => b !== null),
                taxPolicies,
                DEFAULT_SERVICE_BUDGETS,
                []
              )}
              onUpdateServiceBudget={(serviceId, newBudgetPercentage) => {
                addNotification(`Updated ${serviceId} budget to ${newBudgetPercentage}%`, 'info');
              }}
              onUpdateTaxPolicy={(policyId, rate) => {
                const updatedPolicies = updateTaxPolicy(taxPolicies, policyId, rate);
                setTaxPolicies(updatedPolicies);
                setCityBudget(calculateCityBudget(grid.filter(b => b !== null), updatedPolicies));
              }}
              onToggleTaxPolicy={(policyId) => {
                const updatedPolicies = toggleTaxPolicy(taxPolicies, policyId);
                setTaxPolicies(updatedPolicies);
                setCityBudget(calculateCityBudget(grid.filter(b => b !== null), updatedPolicies));
              }}
              onPurchaseInfrastructureUpgrade={(upgradeId) => {
                addNotification(`Infrastructure upgrade ${upgradeId} purchased!`, 'success');
              }}
              onClose={() => setShowBudgetModal(false)}
              playerLevel={level}
              grid={grid}
            />
          )}
        </AnimatePresence>
      </AppLayout>
    );
  }
