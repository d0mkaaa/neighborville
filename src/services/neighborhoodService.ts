import type { GameProgress } from '../types/game';
import { API_URL } from '../config/apiConfig';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
});

export const saveNeighborhoodToServer = async (gameData: GameProgress): Promise<boolean> => {
  try {
    if (!gameData.playerName) {
      console.error('Cannot save neighborhood without player name');
      return false;
    }

    if (!gameData.neighborhoodName) {
      gameData.neighborhoodName = 'Unnamed City';
    }
    
    gameData.lastAutoSave = Date.now();

    console.log(`Attempting to save neighborhood to server at ${API_URL}/api/user/neighborhood/save`);
    
    const saveResult = await fetch(`${API_URL}/api/user/neighborhood/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ gameData })
    });

    console.log('Neighborhood save request completed with status:', saveResult.status);

    if (!saveResult.ok) {
      const errorData = await saveResult.json().catch(() => null);
      
      if (saveResult.status === 403 && errorData?.suspended) {
        console.warn('Neighborhood save blocked: User is suspended');
        return false;
      }
      
      const errorText = errorData?.message || `HTTP ${saveResult.status}`;
      throw new Error(`Failed to save neighborhood: ${errorText}`);
    }

    const result = await saveResult.json();
    console.log('Neighborhood save result:', result);
    return result.success;
  } catch (error) {
    console.error('Error saving neighborhood to server:', error);
    return false;
  }
};

export const loadNeighborhoodFromServer = async (): Promise<{ success: boolean; gameData?: GameProgress; lastSave?: Date | null; message?: string }> => {
  try {
    console.log(`Loading neighborhood from server at ${API_URL}/api/user/neighborhood/load`);
    
    const response = await fetch(`${API_URL}/api/user/neighborhood/load`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    console.log('Neighborhood load request completed with status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      if (response.status === 403 && errorData?.suspended) {
        return { 
          success: false, 
          message: 'Account suspended. Cannot load neighborhood data.' 
        };
      }
      
      const errorText = errorData?.message || `HTTP ${response.status}`;
      throw new Error(`Failed to load neighborhood: ${errorText}`);
    }

    const result = await response.json();
    console.log('Neighborhood load result:', result);
    
    return {
      success: result.success,
      gameData: result.gameData,
      lastSave: result.lastSave ? new Date(result.lastSave) : null
    };
  } catch (error) {
    console.error('Error loading neighborhood from server:', error);
    return { 
      success: false, 
      message: 'Failed to load neighborhood data from server' 
    };
  }
};

export const updateNeighborhoodName = async (neighborhoodName: string): Promise<boolean> => {
  try {
    if (!neighborhoodName.trim()) {
      console.error('Cannot update neighborhood with empty name');
      return false;
    }

    console.log(`Updating neighborhood name to "${neighborhoodName}"`);
    
    const response = await fetch(`${API_URL}/api/user/neighborhood/name`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ neighborhoodName })
    });

    console.log('Neighborhood name update request completed with status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorText = errorData?.message || `HTTP ${response.status}`;
      throw new Error(`Failed to update neighborhood name: ${errorText}`);
    }

    const result = await response.json();
    console.log('Neighborhood name update result:', result);
    return result.success;
  } catch (error) {
    console.error('Error updating neighborhood name:', error);
    return false;
  }
};

export const startFreshNeighborhood = async (newNeighborhoodName?: string): Promise<{ success: boolean; gameData?: GameProgress; message?: string }> => {
  try {
    console.log(`Starting fresh neighborhood${newNeighborhoodName ? ` with name "${newNeighborhoodName}"` : ''}`);
    
    const response = await fetch(`${API_URL}/api/user/neighborhood/reset`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify({ newNeighborhoodName })
    });

    console.log('Fresh neighborhood request completed with status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorText = errorData?.message || `HTTP ${response.status}`;
      throw new Error(`Failed to start fresh neighborhood: ${errorText}`);
    }

    const result = await response.json();
    console.log('Fresh neighborhood result:', result);
    
    return {
      success: result.success,
      gameData: result.gameData,
      message: result.message
    };
  } catch (error) {
    console.error('Error starting fresh neighborhood:', error);
    return { 
      success: false, 
      message: 'Failed to start fresh neighborhood' 
    };
  }
};

export const checkNeighborhoodAccess = async (): Promise<{ success: boolean; authenticated: boolean }> => {
  try {
    const response = await fetch(`${API_URL}/api/user/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    return {
      success: true,
      authenticated: response.ok
    };
  } catch (error) {
    console.error('Error checking neighborhood access:', error);
    return { 
      success: false, 
      authenticated: false 
    };
  }
};