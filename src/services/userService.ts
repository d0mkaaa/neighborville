import { API_URL } from '../config/apiConfig';

export interface User {
  id: string;
  email: string;
  username: string;
  verified: boolean;
  settings?: {
    soundEnabled?: boolean;
    musicEnabled?: boolean;
    notificationsEnabled?: boolean;
    theme?: string;
    language?: string;
    [key: string]: any;
  };
  profileSettings?: {
    visibility: 'public' | 'private';
    showBio: boolean;
    showStats: boolean;
    showActivity: boolean;
    bio?: string;
  };
  isGuest?: boolean;
  createdAt?: string | Date;
  lastLogin?: string | Date;
  lastSave?: string | Date;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

const saveAuthToken = (token: string): void => {
  if (!token) return;
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    document.cookie = `neighborville_auth=${token}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    
    sessionStorage.setItem('neighborville_auth_token', token);
    
    console.log('Auth token saved successfully');
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

const getAuthToken = (): string | null => {
  try {
    const cookies = document.cookie.split(';');
    let token = null;
    
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'neighborville_auth' && value) {
        token = value;
        break;
      }
    }
    
    if (!token) {
      token = sessionStorage.getItem('neighborville_auth_token');
    }
    
    if (!token || token === 'undefined' || token === 'null') {
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const clearAuthToken = (): void => {
  try {
    document.cookie = 'neighborville_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    sessionStorage.removeItem('neighborville_auth_token');
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
};

const getAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const register = async (
  email: string,
  password: string,
  username?: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/user/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        email,
        password,
        username
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Error during registration:', error);
    return {
      success: false,
      message: 'Network error during registration'
    };
  }
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const checkUser = await fetch(`${API_URL}/api/user/check-registered`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email })
    }).catch(() => null);
    
    if (!checkUser || !checkUser.ok) {
      const data = checkUser ? await checkUser.json() : null;
      
      if (data && data.exists === false) {
        return {
          success: false,
          message: 'This email is not registered. Please create an account first.'
        };
      }
    }
    
    const response = await fetch(`${API_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();
    
    if (data.success && data.token) {
      saveAuthToken(data.token);
    }
    
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    return {
      success: false,
      message: 'Network error during login'
    };
  }
};

export const logout = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/user/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    clearAuthToken();
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token found, user must be logged in first');
      return null;
    }
    
    const response = await fetch(`${API_URL}/api/user/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    if (response.status === 401) {
      clearAuthToken();
      sessionStorage.removeItem('neighborville_playerName');
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { 
        detail: { message: 'Authentication required' }
      }));
      return null;
    }
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.user) {
      return data.user as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const checkRegisteredEmail = async (
  email: string
): Promise<{ exists: boolean; message?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/user/check-registered`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    return {
      exists: data.exists || false,
      message: data.message
    };
  } catch (error) {
    console.error('Error checking if email is registered:', error);
    return { exists: false, message: 'Error checking email registration status' };
  }
};

export const verifyEmail = async (
  email: string,
  code: string,
  username?: string
): Promise<{ success: boolean; user?: any; message?: string; isNewRegistration?: boolean }> => {
  try {
    const response = await fetch(`${API_URL}/api/user/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, code, username })
    });

    const data = await response.json();
    
    if (!data.success) {
      console.error('Verification failed:', data.message);
      return {
        success: false,
        message: data.message || 'Verification failed'
      };
    }

    if (data.token) {
      saveAuthToken(data.token);
      console.log('Auth token saved after verification');
      
      if (username || (data.user && data.user.username)) {
        const usernameToBeSaved = username || data.user.username;
        sessionStorage.setItem('neighborville_playerName', usernameToBeSaved);
      }
    } else {
      console.warn('No token received from verification');
    }
    
    return {
      success: true,
      user: data.user,
      isNewRegistration: data.isNewRegistration
    };
  } catch (error) {
    console.error('Error verifying email:', error);
    return { success: false, message: 'Server error during verification' };
  }
};

export const resendVerification = async (
  email: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/user/resend-verification`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        email
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error resending verification email:', error);
    return false;
  }
};

export const updateUserSettings = async (
  userId: string,
  settings: any
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/user/${userId}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        settings
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error updating user settings:', error);
    return false;
  }
};

export const updateUser = async (
  userId: string,
  userData: Partial<User>
): Promise<boolean> => {
  try {
    const { username, ...allowedUpdates } = userData;
    
    const response = await fetch(`${API_URL}/api/user/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(allowedUpdates)
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

export const getUserProfile = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/api/user/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.success && data.user) {
      return data.user as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const getUserSessions = async () => {
  try {
    const response = await fetch(`${API_URL}/api/user/sessions`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.success ? data.sessions : [];
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
};

export interface LeaderboardEntry {
  username: string;
  playerName: string;
  level: number;
  day: number;
  buildingCount: number;
  lastActive: string;
  happiness?: number;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  message?: string;
}

export const getLeaderboard = async (
  sort: 'level' | 'buildingCount' | 'day' = 'level',
  page: number = 1,
  limit: number = 10
): Promise<LeaderboardResponse> => {
  try {
    const response = await fetch(
      `${API_URL}/api/user/leaderboard?sort=${sort}&page=${page}&limit=${limit}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return {
      success: false,
      leaderboard: [],
      pagination: {
        total: 0,
        page: page,
        limit: limit,
        pages: 0
      },
      message: typeof error === 'string' ? error : error instanceof Error ? error.message : 'Failed to load leaderboard'
    };
  }
};

export interface PublicProfileData {
  username: string;
  createdAt: string;
  lastActive: string;
  gameData: {
    playerName: string;
    day: number;
    level: number;
    happiness: number;
    stats: {
      buildingCount: number;
      neighborCount: number;
      totalIncome: number;
      happiness: number;
    };
    grid?: any[];
  } | null;
  showBio: boolean;
  showStats: boolean;
  showActivity: boolean;
}

export const getPublicProfile = async (username: string): Promise<{
  success: boolean;
  profile?: PublicProfileData;
  isPrivate?: boolean;
  message?: string;
}> => {
  try {
    const response = await fetch(`${API_URL}/api/user/profile/${username}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        isPrivate: error.isPrivate || false,
        message: error.message || `Failed to fetch profile: ${response.status}`
      };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching public profile:', error);
    return {
      success: false,
      message: typeof error === 'string' ? error : error instanceof Error ? error.message : 'Failed to load profile'
    };
  }
};