import mongoose from 'mongoose';
import { logSecurityEvent } from './securityLogger.js';

const MAX_COINS = 1000000000;
const MAX_LEVEL = 999;
const MAX_EXPERIENCE = 999999999;
const MAX_DAY = 36500;
const MAX_GRID_SIZE = 64;
const MAX_BUILDINGS_PER_SAVE = 4096;
const MAX_STRING_LENGTH = 1000;
const MAX_ARRAY_LENGTH = 10000;

const sanitizeString = (value, maxLength = MAX_STRING_LENGTH) => {
  if (typeof value !== 'string') {
    return '';
  }
  
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, maxLength);
};

const sanitizeNumber = (value, min = 0, max = Number.MAX_SAFE_INTEGER, defaultValue = 0) => {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, Math.floor(num)));
};

const validateGrid = (grid, gridSize) => {
  if (!Array.isArray(grid)) {
    return Array(gridSize * gridSize).fill(null);
  }
  
  const expectedSize = gridSize * gridSize;
  if (grid.length !== expectedSize) {
    const newGrid = Array(expectedSize).fill(null);
    for (let i = 0; i < Math.min(grid.length, expectedSize); i++) {
      newGrid[i] = grid[i];
    }
    return newGrid;
  }
  
  return grid.map(building => {
    if (!building || typeof building !== 'object') {
      return null;
    }
    
    const sanitizedBuilding = {
      id: sanitizeString(building.id, 50),
      name: sanitizeString(building.name, 100),
      type: sanitizeString(building.type, 50),
      x: sanitizeNumber(building.x, 0, gridSize - 1, 0),
      y: sanitizeNumber(building.y, 0, gridSize - 1, 0),
      level: sanitizeNumber(building.level, 1, 10, 1),
      income: sanitizeNumber(building.income, 0, 10000, 0),
      cost: sanitizeNumber(building.cost, 0, 1000000, 0),
      energyUsage: sanitizeNumber(building.energyUsage, 0, 1000, 0),
      waterUsage: sanitizeNumber(building.waterUsage, 0, 1000, 0),
      happiness: sanitizeNumber(building.happiness, 0, 100, 0),
      residents: sanitizeNumber(building.residents, 0, 20, 0),
      maxResidents: sanitizeNumber(building.maxResidents, 0, 20, 0),
      isConnectedToPower: Boolean(building.isConnectedToPower),
      isConnectedToWater: Boolean(building.isConnectedToWater),
      lastCollected: building.lastCollected ? new Date(building.lastCollected) : null,
      upgrades: Array.isArray(building.upgrades) ? 
        building.upgrades.slice(0, 10).map(u => sanitizeString(u, 50)) : []
    };
    
    Object.keys(sanitizedBuilding).forEach(key => {
      if (sanitizedBuilding[key] === undefined || sanitizedBuilding[key] === null) {
        delete sanitizedBuilding[key];
      }
    });
    
    return sanitizedBuilding;
  });
};

const validateNeighborProgress = (neighborProgress) => {
  if (!neighborProgress || typeof neighborProgress !== 'object') {
    return {};
  }
  
  const sanitizedProgress = {};
  Object.keys(neighborProgress).slice(0, 100).forEach(neighborId => {
    const progress = neighborProgress[neighborId];
    if (progress && typeof progress === 'object') {
      sanitizedProgress[sanitizeString(neighborId, 50)] = {
        unlocked: Boolean(progress.unlocked),
        hasHome: Boolean(progress.hasHome),
        houseIndex: sanitizeNumber(progress.houseIndex, 0, 1000, 0),
        satisfaction: sanitizeNumber(progress.satisfaction, 0, 100, 0)
      };
    }
  });
  
  return sanitizedProgress;
};

const validateArray = (arr, maxLength = MAX_ARRAY_LENGTH, itemValidator = null) => {
  if (!Array.isArray(arr)) {
    return [];
  }
  
  return arr.slice(0, maxLength).map(item => {
    if (itemValidator) {
      return itemValidator(item);
    }
    return item;
  });
};

export const validateAndSanitizeGameData = (gameData, userId = null) => {
  try {
    if (!gameData || typeof gameData !== 'object') {
      throw new Error('Invalid game data: not an object');
    }
    
    const requiredFields = ['playerName', 'neighborhoodName', 'coins', 'day', 'level', 'grid', 'gridSize'];
    for (const field of requiredFields) {
      if (!(field in gameData)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    const gridSize = sanitizeNumber(gameData.gridSize, 8, MAX_GRID_SIZE, 16);
    
    const sanitizedData = {
      playerName: sanitizeString(gameData.playerName, 30),
      neighborhoodName: sanitizeString(gameData.neighborhoodName, 50),
      coins: sanitizeNumber(gameData.coins, 0, MAX_COINS, 0),
      day: sanitizeNumber(gameData.day, 1, MAX_DAY, 1),
      level: sanitizeNumber(gameData.level, 1, MAX_LEVEL, 1),
      experience: sanitizeNumber(gameData.experience, 0, MAX_EXPERIENCE, 0),
      gridSize: gridSize,
      
      grid: validateGrid(gameData.grid, gridSize),
      neighborProgress: validateNeighborProgress(gameData.neighborProgress),
      
      completedAchievements: validateArray(gameData.completedAchievements, 1000, 
        item => sanitizeString(item, 50)),
      seenAchievements: validateArray(gameData.seenAchievements, 1000, 
        item => sanitizeString(item, 50)),
      bills: validateArray(gameData.bills, 100),
      recentEvents: validateArray(gameData.recentEvents, 50),
      coinHistory: validateArray(gameData.coinHistory, 1000),
      
      gameTime: sanitizeNumber(gameData.gameTime, 0, 24, 8),
      gameMinutes: sanitizeNumber(gameData.gameMinutes, 0, 59, 0),
      timeOfDay: ['morning', 'day', 'evening', 'night'].includes(gameData.timeOfDay) ? 
        gameData.timeOfDay : 'day',
      weather: ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy'].includes(gameData.weather) ? 
        gameData.weather : 'sunny',
      
      totalEnergyUsage: sanitizeNumber(gameData.totalEnergyUsage, 0, 100000, 0),
      energyRate: sanitizeNumber(gameData.energyRate, 0, 100, 2),
      lastBillDay: sanitizeNumber(gameData.lastBillDay, 0, MAX_DAY, 0),
      
      powerGrid: gameData.powerGrid && typeof gameData.powerGrid === 'object' ? {
        totalPowerProduction: sanitizeNumber(gameData.powerGrid.totalPowerProduction, 0, 100000, 0),
        totalPowerConsumption: sanitizeNumber(gameData.powerGrid.totalPowerConsumption, 0, 100000, 0),
        connectedBuildings: validateArray(gameData.powerGrid.connectedBuildings, 1000),
        powerOutages: validateArray(gameData.powerGrid.powerOutages, 100)
      } : {
        totalPowerProduction: 0,
        totalPowerConsumption: 0,
        connectedBuildings: [],
        powerOutages: []
      },
      
      waterGrid: gameData.waterGrid && typeof gameData.waterGrid === 'object' ? {
        totalWaterProduction: sanitizeNumber(gameData.waterGrid.totalWaterProduction, 0, 100000, 0),
        totalWaterConsumption: sanitizeNumber(gameData.waterGrid.totalWaterConsumption, 0, 100000, 0),
        connectedBuildings: validateArray(gameData.waterGrid.connectedBuildings, 1000),
        waterShortages: validateArray(gameData.waterGrid.waterShortages, 100)
      } : {
        totalWaterProduction: 0,
        totalWaterConsumption: 0,
        connectedBuildings: [],
        waterShortages: []
      },
      
      saveTimestamp: gameData.saveTimestamp || Date.now(),
      lastAutoSave: gameData.lastAutoSave || Date.now(),
      version: sanitizeString(gameData.version, 10) || '1.0',
      
      saveId: gameData.saveId && typeof gameData.saveId === 'string' ? 
        sanitizeString(gameData.saveId, 100) : undefined
    };
    
    if (!sanitizedData.playerName) {
      throw new Error('Player name cannot be empty');
    }
    
    if (!sanitizedData.neighborhoodName) {
      sanitizedData.neighborhoodName = 'Unnamed City';
    }
    
    const suspiciousIndicators = [];
    if (sanitizedData.coins > 100000000) suspiciousIndicators.push('excessive_coins');
    if (sanitizedData.level > 500) suspiciousIndicators.push('excessive_level');
    if (sanitizedData.day > 10000) suspiciousIndicators.push('excessive_days');
    
    if (suspiciousIndicators.length > 0 && userId) {
      logSecurityEvent(userId, 'SUSPICIOUS_GAME_DATA', {
        indicators: suspiciousIndicators,
        values: {
          coins: sanitizedData.coins,
          level: sanitizedData.level,
          day: sanitizedData.day
        }
      });
    }
    
    return sanitizedData;
    
  } catch (error) {
    throw new Error(`Game data validation failed: ${error.message}`);
  }
};

export const generateSaveId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const additionalRandom = Math.random().toString(36).substring(2, 10);
  return `save_${timestamp}_${randomPart}_${additionalRandom}`;
};

export const isValidSaveId = (saveId) => {
  if (typeof saveId !== 'string') return false;
  
  const oldFormat = /^save-\d+-[a-z0-9]+$/;
  const newFormat = /^save_[a-z0-9]+_[a-z0-9]+_[a-z0-9]+$/;
  
  return oldFormat.test(saveId) || newFormat.test(saveId);
};

export const validateGameProgression = (gameData) => {
  const warnings = [];
  
  const expectedMinExp = Math.max(0, (gameData.level - 1) * 100);
  const expectedMaxExp = gameData.level * 1000;
  
  if (gameData.experience < expectedMinExp || gameData.experience > expectedMaxExp) {
    warnings.push('level_experience_mismatch');
  }
  
  const buildingCount = gameData.grid.filter(b => b !== null).length;
  const expectedMaxBuildings = gameData.level * 5;
  
  if (buildingCount > expectedMaxBuildings) {
    warnings.push('excessive_buildings_for_level');
  }
  
  const expectedMaxCoins = (gameData.day * gameData.level * 1000) + 10000;
  
  if (gameData.coins > expectedMaxCoins) {
    warnings.push('excessive_coins_for_progression');
  }
  
  return warnings;
};

export default {
  validateAndSanitizeGameData,
  generateSaveId,
  isValidSaveId,
  validateGameProgression
}; 