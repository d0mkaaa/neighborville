import type { GameProgress } from '../types/game';
import { NORMALIZED_API_URL } from '../config/apiConfig';
import { logger } from '../utils/logger';

const getAuthHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json'
  };
};

export const saveGameToServer = async (gameData: GameProgress): Promise<boolean> => {
  try {
    if (!gameData.playerName) {
      logger.error('Cannot save game without player name');
      return false;
    }

    if (!gameData.saveId) {
      gameData.saveId = `save_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    if (!gameData.saveTimestamp) {
      gameData.saveTimestamp = Date.now();
    }

    console.log(`Attempting to save game to server at ${NORMALIZED_API_URL}/api/user/game/save`);
    
    const saveResult = await fetch(`${NORMALIZED_API_URL}/api/user/game/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ gameData })
    });

    console.log('Save request completed with status:', saveResult.status);

    if (!saveResult.ok) {
      const errorData = await saveResult.json().catch(() => null);
      
      if (saveResult.status === 403 && errorData?.suspended) {
        console.warn('Game save blocked: User is suspended');
        return false;
      }
      
      const errorText = errorData?.message || `HTTP ${saveResult.status}`;
      throw new Error(`Failed to save game: ${errorText}`);
    }

    const result = await saveResult.json();
    console.log('Save result:', result);
    return result.success;
  } catch (error) {
    console.error('Error saving game to server:', error);
    return false;
  }
};

export const loadGameFromServer = async (): Promise<{gameData: GameProgress | null, lastSave: Date | null}> => {
  try {
    console.log(`Attempting to load game from server at ${NORMALIZED_API_URL}/api/user/game/load`);
    
    const response = await fetch(`${NORMALIZED_API_URL}/api/user/game/load`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    console.log('Load request completed with status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      if (response.status === 403 && errorData?.suspended) {
        console.warn('Game load blocked: User is suspended');
        return { gameData: null, lastSave: null };
      }
      
      throw new Error(`Failed to load game: ${response.status}`);
    }

    const result = await response.json();
    console.log('Load result:', result);
    
    if (result.success && result.gameData) {
      const gameData = result.gameData;
      
      if (gameData.happiness !== undefined) {
        delete gameData.happiness;
      }
      
      if (gameData.grid && Array.isArray(gameData.grid)) {
        gameData.grid = gameData.grid.map(building => {
          if (building && building.happiness !== undefined) {
            const newBuilding = {...building};
            delete newBuilding.happiness;
            return newBuilding;
          }
          return building;
        });
      }
      
      return {
        gameData,
        lastSave: result.lastSave ? new Date(result.lastSave) : null
      };
    }
    
    return { gameData: null, lastSave: null };
  } catch (error) {
    console.error('Error loading game from server:', error);
    return { gameData: null, lastSave: null };
  }
};

export const loadSpecificSaveFromServer = async (saveId: string): Promise<{gameData: GameProgress | null, lastSave: Date | null}> => {
  try {
    console.log(`Attempting to load specific save from server at ${NORMALIZED_API_URL}/api/user/game/save/${encodeURIComponent(saveId)}`);
    
    const response = await fetch(`${NORMALIZED_API_URL}/api/user/game/save/${encodeURIComponent(saveId)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    console.log('Load specific save request completed with status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to load save: ${response.status}`);
    }

    const result = await response.json();
    console.log('Load specific save result:', result);
    
    if (result.success && result.gameData) {
      const gameData = result.gameData;
      
      if (gameData.happiness !== undefined) {
        delete gameData.happiness;
      }
      
      if (gameData.grid && Array.isArray(gameData.grid)) {
        gameData.grid = gameData.grid.map(building => {
          if (building && building.happiness !== undefined) {
            const newBuilding = {...building};
            delete newBuilding.happiness;
            return newBuilding;
          }
          return building;
        });
      }
      
      return {
        gameData,
        lastSave: result.lastSave ? new Date(result.lastSave) : null
      };
    }
    
    return { gameData: null, lastSave: null };
  } catch (error) {
    console.error('Error loading specific save from server:', error);
    return { gameData: null, lastSave: null };
  }
};

export const getAllSavesFromServer = async (): Promise<{id: string, playerName: string, timestamp: number, data: GameProgress}[]> => {
  try {
    console.log(`Attempting to get saves from server at ${NORMALIZED_API_URL}/api/user/game/saves`);
    
    const response = await fetch(`${NORMALIZED_API_URL}/api/user/game/saves`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    console.log('Get saves request completed with status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to load saves: ${response.status}`);
    }

    const result = await response.json();
    console.log('Get saves result:', result);
    
    if (result.success && Array.isArray(result.saves)) {
      return result.saves;
    }
    
    return [];
  } catch (error) {
    console.error('Error loading saves from server:', error);
    return [];
  }
};

export const deleteSaveFromServer = async (saveId: string): Promise<boolean> => {
  try {
    console.log(`Attempting to delete save from server at ${NORMALIZED_API_URL}/api/user/game/save/${encodeURIComponent(saveId)}`);
    
    const response = await fetch(`${NORMALIZED_API_URL}/api/user/game/save/${encodeURIComponent(saveId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    console.log('Delete save request completed with status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to delete save: ${response.status}`);
    }

    const result = await response.json();
    console.log('Delete save result:', result);
    return result.success;
  } catch (error) {
    console.error('Error deleting save from server:', error);
    return false;
  }
};

const MIN_AUTOSAVE_INTERVAL = 120000;

let lastAutoSave = 0;

export const shouldSaveGame = (gameData: GameProgress | null): boolean => {
  if (!gameData) {
    return false;
  }
  
  const now = Date.now();
  
  if (now - lastAutoSave < MIN_AUTOSAVE_INTERVAL) {
    return false;
  }
  
  if (gameData.lastAutoSave && now - gameData.lastAutoSave < MIN_AUTOSAVE_INTERVAL) {
    return false;
  }
  
  lastAutoSave = now;
  return true;
};

export const getGameSaveStats = (gameData: GameProgress) => {
  return {
    lastSave: gameData.saveTimestamp ? new Date(gameData.saveTimestamp) : null,
    timeSinceLastSave: gameData.saveTimestamp ? Date.now() - gameData.saveTimestamp : null,
    saveId: gameData.saveId || null
  };
};

export const validateGameData = (gameData: GameProgress): boolean => {
  if (!gameData || typeof gameData !== 'object') {
    console.error('Invalid game data: not an object');
    return false;
  }
  
  const requiredFields = [
    'playerName',
    'neighborhoodName',
    'coins',
    'day',
    'level',
    'experience',
    'grid',
    'gridSize'
  ];
  
  for (const field of requiredFields) {
    if (!(field in gameData)) {
      console.error(`Invalid game data: missing required field '${field}'`);
      return false;
    }
  }
  
  if (!Array.isArray(gameData.grid)) {
    console.error('Invalid game data: grid is not an array');
    return false;
  }
  
  if (gameData.grid.length !== gameData.gridSize * gameData.gridSize) {
    console.error('Invalid game data: grid size mismatch');
    return false;
  }
  
  return true;
};

export const shouldSaveOnAction = (action: string): boolean => {
  const criticalActions = [
    'build',
    'demolish',
    'upgrade',
    'move',
    'connect',
    'disconnect',
    'assign_resident',
    'remove_resident',
    'pay_bill',
    'collect_income',
    'complete_achievement',
    'unlock_neighbor',
    'level_up',
    'change_name',
    'change_policy',
    'change_budget'
  ];
  
  return criticalActions.includes(action);
};

export const hasUnsavedChanges = async (): Promise<boolean> => {
  return false;
}; 