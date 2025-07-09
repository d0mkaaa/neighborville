import { validateAndSanitizeGameData, generateSaveId } from '../utils/gameDataValidator.js';
import { saveGame } from './saveService.js';
import { findUserById } from './userService.js';

const createFreshGameState = (playerName, neighborhoodName = 'New City') => {
  const saveId = generateSaveId();
  const timestamp = Date.now();
  
  return {
    playerName: playerName.trim(),
    neighborhoodName: neighborhoodName.trim() || 'New City',
    saveId,
    saveTimestamp: timestamp,
    version: '1.0',
    
    coins: 2000,
    day: 1,
    level: 1,
    experience: 0,
    
    gridSize: 16,
    grid: Array(256).fill(null),
    
    gameTime: 8,
    gameMinutes: 0,
    timeOfDay: 'morning',
    weather: 'sunny',
    
    neighborProgress: {},
    completedAchievements: [],
    seenAchievements: [],
    bills: [],
    recentEvents: [],
    coinHistory: [{
      id: `init_${timestamp}`,
      day: 1,
      balance: 2000,
      amount: 2000,
      type: 'income',
      description: 'Starting funds',
      timestamp
    }],
    
    totalEnergyUsage: 0,
    energyRate: 2,
    lastBillDay: 0,
    
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
      balance: 2000,
      dailyBalance: 0,
      emergencyFund: 0,
      budgetHealth: 'excellent'
    },
    
    playerResources: {
      wood: 10,
      stone: 10,
      iron_ore: 5
    },
    
    productionQueues: {},
    activeProductions: {},
    
    neighbors: [],
    achievements: [],
    
    neighborhoodFoundedDate: timestamp,
    neighborhoodMilestones: [],
    cityEra: 'Beginning',
    lastAutoSave: timestamp
  };
};

export const initializeNewGame = async (userId, playerName, neighborhoodName, req = null) => {
  try {
    console.log(`Initializing new game for user ${userId}: ${playerName} - ${neighborhoodName}`);
    
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      throw new Error('Player name is required');
    }
    
    if (playerName.trim().length > 30) {
      throw new Error('Player name must be 30 characters or less');
    }
    
    const user = await findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const gameState = createFreshGameState(playerName, neighborhoodName);
    
    const validatedGameState = validateAndSanitizeGameData(gameState, userId);
    
    const saveResult = await saveGame(userId, validatedGameState, 'manual', req);
    
    console.log(`Successfully initialized new game for user ${userId}, saveId: ${saveResult.saveId}`);
    
    return {
      success: true,
      gameData: validatedGameState,
      saveId: saveResult.saveId,
      message: 'New game initialized successfully'
    };
    
  } catch (error) {
    console.error(`Failed to initialize new game for user ${userId}:`, error);
    throw error;
  }
};

export const hasExistingSaves = async (userId) => {
  try {
    const user = await findUserById(userId);
    if (!user) {
      return false;
    }
    
    if (user.gameSaves && user.gameSaves.length > 0) {
      return true;
    }
    
    if (user.gameData && typeof user.gameData === 'object') {
      const hasValidGameData = user.gameData.playerName && 
                              user.gameData.grid && 
                              Array.isArray(user.gameData.grid);
      return hasValidGameData;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking existing saves for user ${userId}:`, error);
    return false;
  }
};

export const getStartingGameState = async (userId, req = null) => {
  try {
    const user = await findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const hasSaves = await hasExistingSaves(userId);
    
    if (hasSaves) {
      if (user.gameSaves && user.gameSaves.length > 0) {
        const latestSave = user.gameSaves.reduce((latest, current) => {
          return !latest || current.timestamp > latest.timestamp ? current : latest;
        }, null);
        
        return {
          success: true,
          gameData: latestSave.data,
          isExisting: true,
          saveId: latestSave.id
        };
      }
      
      if (user.gameData) {
        return {
          success: true,
          gameData: user.gameData,
          isExisting: true
        };
      }
    }
    
    const playerName = user.username || 'Mayor';
    const result = await initializeNewGame(userId, playerName, 'My City', req);
    
    return {
      success: true,
      gameData: result.gameData,
      isExisting: false,
      saveId: result.saveId,
      message: 'New game created'
    };
    
  } catch (error) {
    console.error(`Error getting starting game state for user ${userId}:`, error);
    throw error;
  }
};

export const ensureGameState = async (userId, req = null) => {
  try {
    const hasExisting = await hasExistingSaves(userId);
    
    if (!hasExisting) {
      const user = await findUserById(userId);
      if (user) {
        console.log(`User ${userId} has no game state, creating initial game`);
        return await getStartingGameState(userId, req);
      }
    }
    
    return { success: true, hasExisting: true };
  } catch (error) {
    console.error(`Error ensuring game state for user ${userId}:`, error);
    throw error;
  }
};

export default {
  initializeNewGame,
  hasExistingSaves,
  getStartingGameState,
  ensureGameState,
  createFreshGameState
}; 