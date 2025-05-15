import type { GameProgress } from '../types/game';
import { API_URL } from '../config/apiConfig';

export const saveGameToServer = async (gameData: GameProgress): Promise<boolean> => {
  try {
    const isGuest = localStorage.getItem('neighborville_is_guest') === 'true';
    
    if (isGuest) {
      return false;
    }
    
    const response = await fetch(`${API_URL}/api/user/game/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ gameData })
    });
    
    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403) {
        localStorage.setItem('neighborville_is_guest', 'true');
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        return false;
      }
      
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('neighborville_last_server_save', Date.now().toString());
    }
    
    return data.success;
  } catch (error) {
    try {
      localStorage.setItem('neighborville_last_save_error', JSON.stringify({
        time: Date.now(),
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    } catch (e) {
    }
    return false;
  }
};

export const loadGameFromServer = async (): Promise<{gameData: GameProgress | null, lastSave: Date | null}> => {
  try {
    const isGuest = localStorage.getItem('neighborville_is_guest') === 'true';
    
    if (isGuest) {
      return { gameData: null, lastSave: null };
    }
    
    const response = await fetch(`${API_URL}/api/user/game/load`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return { 
      gameData: data.gameData, 
      lastSave: data.lastSave ? new Date(data.lastSave) : null 
    };
  } catch (error) {
    return { gameData: null, lastSave: null };
  }
};

export const shouldSaveGame = (lastSaveTimestamp: string | null, minInterval: number = 300000): boolean => {
  if (!lastSaveTimestamp) return true;
  
  const now = Date.now();
  const lastSave = parseInt(lastSaveTimestamp, 10);
  
  return (now - lastSave) >= minInterval;
};

export const hasUnsavedChanges = async (): Promise<boolean> => {
  try {
    const localTimestamp = localStorage.getItem('neighborville_last_save_timestamp');
    if (!localTimestamp) return false;
    
    const { lastSave } = await loadGameFromServer();
    if (!lastSave) return true;
    
    const localSaveTime = parseInt(localTimestamp, 10);
    const serverSaveTime = lastSave.getTime();
    
    return localSaveTime > serverSaveTime;
  } catch (error) {
    return false;
  }
}; 