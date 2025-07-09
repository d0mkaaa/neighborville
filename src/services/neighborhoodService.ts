import type { GameProgress, SaveGameResponse, LoadGameResponse } from '../types/game';
import api from '../utils/api';
import { createContentManager } from '../utils/contentManager';
import { NORMALIZED_API_URL } from '../config/apiConfig';

const contentManager = createContentManager();

export const saveNeighborhoodToServer = async (gameData: GameProgress): Promise<boolean> => {
  try {
    if (!gameData.playerName || typeof gameData.playerName !== 'string' || gameData.playerName.trim() === '') {
      console.error('Invalid playerName:', gameData.playerName);
      return false;
    }
    
    if (!gameData.grid || !Array.isArray(gameData.grid)) {
      console.error('Invalid grid:', gameData.grid);
      return false;
    }
    
    const validatedGameData = {
      ...gameData,
      playerName: gameData.playerName.trim(),
      grid: gameData.grid || [],
      neighborhoodName: gameData.neighborhoodName || 'Unnamed City',
      coins: gameData.coins || 0,
      day: gameData.day || 1,
      level: gameData.level || 1,
      experience: gameData.experience || 0,
      saveId: gameData.saveId || `save_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 10)}`
    };
    
    console.log('Sending game data to server:', {
      playerName: validatedGameData.playerName,
      hasGrid: !!validatedGameData.grid,
      gridLength: validatedGameData.grid?.length,
      neighborhoodName: validatedGameData.neighborhoodName
    });
    
    const response = await api.post(`${NORMALIZED_API_URL}/api/user/game/save`, { gameData: validatedGameData });
    
    console.log('Save response:', response);
    console.log('Save response type:', typeof response);
    console.log('Save response keys:', response ? Object.keys(response) : 'null');
    console.log('Save response.data:', response?.data);
    console.log('Save response.data type:', typeof response?.data);
    
    const responseData = response?.data || response;
    console.log('Using responseData:', responseData);
    
    if (responseData && responseData.success) {
      if (responseData.saveId) {
        gameData.saveId = responseData.saveId;
      }
      if (responseData.timestamp) {
        gameData.saveTimestamp = responseData.timestamp;
      }
      return true;
    }
    
    console.error('Failed to save game:', responseData?.message || 'Unknown error');
    return false;
  } catch (error) {
    console.error('Error saving game:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return false;
  }
};

export const loadNeighborhoodFromServer = async (): Promise<{ success: boolean; gameData: GameProgress | null }> => {
  try {
    const response = await api.get(`${NORMALIZED_API_URL}/api/user/neighborhood/load`);
    
    if (response.data.success && response.data.gameData) {
      const gameData = response.data.gameData;
      const { neighbors, achievements } = contentManager.mergePlayerProgress(
        contentManager.getNeighbors(),
        contentManager.getAchievements(),
        gameData
      );
      
      return {
        success: true,
        gameData: {
          ...gameData,
          neighbors,
          achievements
        }
      };
    }
    
    return { success: true, gameData: null };
  } catch (error) {
    console.error('Error loading game:', error);
    return { success: false, gameData: null };
  }
};

export const loadSpecificSave = async (saveId: string): Promise<GameProgress | null> => {
  try {
    const response = await api.get(`${NORMALIZED_API_URL}/api/user/game/save/${saveId}`);
    
    if (response.data.success && response.data.gameData) {
      return response.data.gameData;
    }
    
    console.error('Failed to load specific save:', response.data.message);
    return null;
  } catch (error) {
    console.error('Error loading specific save:', error);
    return null;
  }
};

export const getAllSaves = async (): Promise<{ id: string; playerName: string; timestamp: number; data: GameProgress }[]> => {
  try {
    const response = await api.get(`${NORMALIZED_API_URL}/api/user/game/saves`);
    
    if (response.data.success) {
      return response.data.saves;
    }
    
    console.error('Failed to get saves:', response.data.message);
    return [];
  } catch (error) {
    console.error('Error getting saves:', error);
    return [];
  }
};

export const deleteSave = async (saveId: string): Promise<boolean> => {
  try {
    const response = await api.delete(`${NORMALIZED_API_URL}/api/user/game/save/${saveId}`);
    
    if (response.data.success) {
      return true;
    }
    
    console.error('Failed to delete save:', response.data.message);
    return false;
  } catch (error) {
    console.error('Error deleting save:', error);
    return false;
  }
};

export const updateNeighborhoodName = async (newName: string): Promise<boolean> => {
  try {
    const response = await api.post(`${NORMALIZED_API_URL}/api/user/game/update-name`, { name: newName });
    return response.data.success;
  } catch (error) {
    console.error('Error updating neighborhood name:', error);
    return false;
  }
};

export const startFreshNeighborhood = async (): Promise<GameProgress> => {
  const freshGameData: GameProgress = {
    playerName: '',
    neighborhoodName: 'New Neighborhood',
    coins: 2000,
    day: 1,
    level: 1,
    experience: 0,
    grid: Array(64).fill(null),
    gridSize: 16,
    neighborProgress: {},
    completedAchievements: [],
    seenAchievements: [],
    gameTime: 8,
    gameMinutes: 0,
    timeOfDay: 'morning',
    recentEvents: [],
    bills: [],
    energyRate: 2,
    totalEnergyUsage: 0,
    lastBillDay: 0,
    coinHistory: [],
    weather: 'sunny',
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
    taxPolicies: [],
    cityBudget: {
      totalRevenue: 0,
      totalExpenses: 0,
      maintenanceCosts: 0,
      taxRevenue: 0,
      buildingIncome: 0,
      balance: 0,
      dailyBalance: 0,
      emergencyFund: 0,
      budgetHealth: 'fair'
    },
    playerResources: {},
    productionQueues: {},
    activeProductions: {},
    neighborhoodFoundedDate: Date.now(),
    neighborhoodMilestones: [],
    cityEra: 'beginning',
    lastAutoSave: Date.now()
  };

  const { neighbors, achievements } = contentManager.mergePlayerProgress(
    contentManager.getNeighbors(),
    contentManager.getAchievements(),
    freshGameData
  );

  freshGameData.neighbors = neighbors;
  freshGameData.achievements = achievements;

  return freshGameData;
};