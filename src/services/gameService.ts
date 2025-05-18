import type { GameProgress } from '../types/game';
import { API_URL } from '../config/apiConfig';

const getAuthToken = (): string | null => {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'neighborville_auth' && value) {
        return value;
      }
    }
    
    const token = sessionStorage.getItem('neighborville_auth_token');
    
    if (!token) {
      console.warn('No auth token found in cookies or sessionStorage');
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Adding auth token to request headers');
  } else {
    console.warn('Missing auth token for request headers');
  }
  
  return headers;
};

export const saveGameToServer = async (gameData: GameProgress): Promise<boolean> => {
  try {
    if (!gameData.playerName) {
      console.error('Cannot save game without player name');
      return false;
    }

    const token = getAuthToken();
    
    if (!token) {
      console.warn('No auth token found, user must be logged in to save');
      return false;
    }

    if (!gameData.saveId) {
      gameData.saveId = `save-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    if (!gameData.saveTimestamp) {
      gameData.saveTimestamp = Date.now();
    }

    console.log(`Attempting to save game to server at ${API_URL}/api/user/game/save`);
    
    const saveResult = await fetch(`${API_URL}/api/user/game/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ gameData })
    });

    console.log('Save request completed with status:', saveResult.status);

    if (!saveResult.ok) {
      const errorText = await saveResult.text();
      throw new Error(`Failed to save game: ${saveResult.status} - ${errorText}`);
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
    const token = getAuthToken();
    
    if (!token) {
      console.warn('No auth token found, user must be logged in to load game');
      return { gameData: null, lastSave: null };
    }

    console.log(`Attempting to load game from server at ${API_URL}/api/user/game/load`);
    
    const response = await fetch(`${API_URL}/api/user/game/load`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    console.log('Load request completed with status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to load game: ${response.status}`);
    }

    const result = await response.json();
    console.log('Load result:', result);
    
    if (result.success && result.gameData) {
      const gameData = result.gameData;
      
      if (gameData.vitality !== undefined) {
        delete gameData.vitality;
      }
      
      if (gameData.vitalityDecay !== undefined) {
        delete gameData.vitalityDecay;
      }
      
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

export const getAllSavesFromServer = async (): Promise<{id: string, playerName: string, timestamp: number, data: GameProgress}[]> => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.warn('No auth token found, user must be logged in to get saves');
      return [];
    }

    console.log(`Attempting to get saves from server at ${API_URL}/api/user/game/saves`);
    
    const response = await fetch(`${API_URL}/api/user/game/saves`, {
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
    const token = getAuthToken();
    
    if (!token) {
      console.warn('No auth token found, user must be logged in to delete saves');
      return false;
    }

    console.log(`Attempting to delete save from server at ${API_URL}/api/user/game/save/${encodeURIComponent(saveId)}`);
    
    const response = await fetch(`${API_URL}/api/user/game/save/${encodeURIComponent(saveId)}`, {
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

export const shouldSaveGame = (lastSaveTimestamp: string | null, minInterval: number = 300000): boolean => {
  if (!lastSaveTimestamp) return true;
  
  const now = Date.now();
  const lastSave = parseInt(lastSaveTimestamp, 10);
  
  return (now - lastSave) > minInterval;
};

export const hasUnsavedChanges = async (): Promise<boolean> => {
  return false;
}; 