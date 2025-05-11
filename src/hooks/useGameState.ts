import { useState, useEffect } from 'react';
import type { GameProgress, TimeOfDay, WeatherType, ExtendedNotification, PowerGridState, WaterGridState, Bill, Achievement, Neighbor, Building, DayRecord, CoinHistoryEntry, RecentEvent } from '../types/game';

export interface GameState {
  playerName: string;
  coins: number;
  happiness: number;
  day: number;
  level: number;
  experience: number;
  gridSize: number;
  grid: (Building | null)[];
  gameTime: number;
  gameMinutes: number;
  timeOfDay: TimeOfDay;
  timePaused: boolean;
  weather: WeatherType;
  notifications: ExtendedNotification[];
  buildings: Building[];
  neighbors: Neighbor[];
  achievements: Achievement[];
  bills: Bill[];
  weatherForecast: WeatherType[];
  totalEnergyUsage: number;
  energyRate: number;
  lastBillDay: number;
  daysUntilBill: number;
  powerGrid: PowerGridState;
  waterGrid: WaterGridState;
  dayRecords: DayRecord[];
  coinHistory: CoinHistoryEntry[];
  recentEvents: RecentEvent[];
  showSettings: boolean;
  showTutorial: boolean;
  showMarketplace: boolean;
  showSpecialEvents: boolean;
  showSocialFeed: boolean;
  musicEnabled: boolean;
}

export interface GameActions {
  setPlayerName: (name: string) => void;
  setCoins: (coins: number) => void;
  setHappiness: (happiness: number) => void;
  setDay: (day: number) => void;
  setLevel: (level: number) => void;
  setExperience: (experience: number) => void;
  setGridSize: (size: number) => void;
  setGrid: (grid: (Building | null)[]) => void;
  setGameTime: (time: number) => void;
  setGameMinutes: (minutes: number) => void;
  setTimeOfDay: (timeOfDay: TimeOfDay) => void;
  setTimePaused: (paused: boolean) => void;
  setWeather: (weather: WeatherType) => void;
  setNotifications: (notifications: ExtendedNotification[]) => void;
  setBuildings: (buildings: Building[]) => void;
  setNeighbors: (neighbors: Neighbor[]) => void;
  setAchievements: (achievements: Achievement[]) => void;
  setBills: (bills: Bill[]) => void;
  setWeatherForecast: (forecast: WeatherType[]) => void;
  setTotalEnergyUsage: (usage: number) => void;
  setEnergyRate: (rate: number) => void;
  setLastBillDay: (day: number) => void;
  setDaysUntilBill: (days: number) => void;
  setPowerGrid: (state: PowerGridState) => void;
  setWaterGrid: (state: WaterGridState) => void;
  setDayRecords: (records: DayRecord[]) => void;
  setCoinHistory: (history: CoinHistoryEntry[]) => void;
  setRecentEvents: (events: RecentEvent[]) => void;
  setShowSettings: (show: boolean) => void;
  setShowTutorial: (show: boolean) => void;
  setShowMarketplace: (show: boolean) => void;
  setShowSpecialEvents: (show: boolean) => void;
  setShowSocialFeed: (show: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info', autoRemove?: boolean) => void;
  removeNotification: (id: string) => void;
  loadGameState: (state: GameProgress) => void;
}

const initialState: GameState = {
  playerName: "",
  coins: 2000,
  happiness: 50,
  day: 1,
  level: 1,
  experience: 0,
  gridSize: 16,
  grid: Array(64).fill(null),
  gameTime: 8,
  gameMinutes: 0,
  timeOfDay: 'morning',
  timePaused: false,
  weather: 'sunny',
  notifications: [],
  buildings: [],
  neighbors: [],
  achievements: [],
  bills: [],
  weatherForecast: [],
  totalEnergyUsage: 0,
  energyRate: 2,
  lastBillDay: 0,
  daysUntilBill: 5,
  powerGrid: {
    totalPowerProduction: 0,
    totalPowerConsumption: 0,
    connectedBuildings: [],
    powerOutages: []
  },
  waterGrid: {
    totalWaterProduction: 0,
    totalWaterConsumption: 0,
    connectedBuildings: [],
    waterShortages: []
  },
  dayRecords: [],
  coinHistory: [],
  recentEvents: [],
  showSettings: false,
  showTutorial: false,
  showMarketplace: false,
  showSpecialEvents: false,
  showSocialFeed: true,
  musicEnabled: false
};

export const useGameState = (initialGameState?: GameProgress | null): [GameState, GameActions] => {
  const [state, setState] = useState<GameState>(initialState);

  const actions: GameActions = {
    setPlayerName: (name) => setState(prev => ({ ...prev, playerName: name })),
    setCoins: (coins) => setState(prev => ({ ...prev, coins })),
    setHappiness: (happiness) => setState(prev => ({ ...prev, happiness })),
    setDay: (day) => setState(prev => ({ ...prev, day })),
    setLevel: (level) => setState(prev => ({ ...prev, level })),
    setExperience: (experience) => setState(prev => ({ ...prev, experience })),
    setGridSize: (size) => setState(prev => ({ ...prev, gridSize: size })),
    setGrid: (grid) => setState(prev => ({ ...prev, grid })),
    setGameTime: (time) => setState(prev => ({ ...prev, gameTime: time })),
    setGameMinutes: (minutes) => setState(prev => ({ ...prev, gameMinutes: minutes })),
    setTimeOfDay: (timeOfDay) => setState(prev => ({ ...prev, timeOfDay })),
    setTimePaused: (paused) => setState(prev => ({ ...prev, timePaused: paused })),
    setWeather: (weather) => setState(prev => ({ ...prev, weather })),
    setNotifications: (notifications) => setState(prev => ({ ...prev, notifications })),
    setBuildings: (buildings) => setState(prev => ({ ...prev, buildings })),
    setNeighbors: (neighbors) => setState(prev => ({ ...prev, neighbors })),
    setAchievements: (achievements) => setState(prev => ({ ...prev, achievements })),
    setBills: (bills) => setState(prev => ({ ...prev, bills })),
    setWeatherForecast: (forecast) => setState(prev => ({ ...prev, weatherForecast: forecast })),
    setTotalEnergyUsage: (usage) => setState(prev => ({ ...prev, totalEnergyUsage: usage })),
    setEnergyRate: (rate) => setState(prev => ({ ...prev, energyRate: rate })),
    setLastBillDay: (day) => setState(prev => ({ ...prev, lastBillDay: day })),
    setDaysUntilBill: (days) => setState(prev => ({ ...prev, daysUntilBill: days })),
    setPowerGrid: (state) => setState(prev => ({ ...prev, powerGrid: state })),
    setWaterGrid: (state) => setState(prev => ({ ...prev, waterGrid: state })),
    setDayRecords: (records) => setState(prev => ({ ...prev, dayRecords: records })),
    setCoinHistory: (history) => setState(prev => ({ ...prev, coinHistory: history })),
    setRecentEvents: (events) => setState(prev => ({ ...prev, recentEvents: events })),
    setShowSettings: (show) => setState(prev => ({ ...prev, showSettings: show })),
    setShowTutorial: (show) => setState(prev => ({ ...prev, showTutorial: show })),
    setShowMarketplace: (show) => setState(prev => ({ ...prev, showMarketplace: show })),
    setShowSpecialEvents: (show) => setState(prev => ({ ...prev, showSpecialEvents: show })),
    setShowSocialFeed: (show) => setState(prev => ({ ...prev, showSocialFeed: show })),
    setMusicEnabled: (enabled) => setState(prev => ({ ...prev, musicEnabled: enabled })),
    
    addNotification: (message, type, autoRemove = true) => {
      const newNotification: ExtendedNotification = {
        id: Math.random().toString(36).substring(2, 9),
        message,
        type,
        autoRemove
      };
      setState(prev => ({ ...prev, notifications: [...prev.notifications, newNotification] }));
    },
    
    removeNotification: (id) => {
      setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }));
    },
    
    loadGameState: (gameState) => {
      setState(prev => ({
        ...prev,
        playerName: gameState.playerName,
        coins: gameState.coins,
        happiness: gameState.happiness,
        day: gameState.day,
        level: gameState.level || 1,
        experience: gameState.experience || 0,
        grid: gameState.grid,
        gridSize: gameState.gridSize || 16,
        gameTime: gameState.gameTime || 8,
        gameMinutes: gameState.gameMinutes || 0,
        timeOfDay: gameState.timeOfDay || 'morning',
        bills: gameState.bills || [],
        totalEnergyUsage: gameState.totalEnergyUsage || 0,
        energyRate: gameState.energyRate || 2,
        lastBillDay: gameState.lastBillDay || 0,
        recentEvents: gameState.recentEvents || [],
        weather: gameState.weather || 'sunny',
        coinHistory: gameState.coinHistory || [],
        powerGrid: gameState.powerGrid || initialState.powerGrid,
        waterGrid: gameState.waterGrid || initialState.waterGrid
      }));
    }
  };

  useEffect(() => {
    if (initialGameState) {
      actions.loadGameState(initialGameState);
    }
  }, []);

  return [state, actions];
};