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

export const register = async (
  email: string,
  password: string,
  username?: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
      headers: {
        'Content-Type': 'application/json'
      },
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
    
    if (data.success) {
      localStorage.setItem('neighborville_last_login', new Date().toISOString());
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
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/api/user/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (response.status === 401) {
      sessionStorage.removeItem('neighborville_playerName');
      sessionStorage.removeItem('neighborville_is_guest');
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

export const verifyEmail = async (
  email: string,
  code: string
): Promise<{ success: boolean; user?: any; message?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/user/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, code }),
    });

    const data = await response.json();
    console.log('Verification response:', data);

    if (data.success && data.user) {
      return {
        success: true,
        user: data.user,
      };
    } else {
      return {
        success: false,
        message: data.message || 'Verification failed',
      };
    }
  } catch (error) {
    console.error('Error during email verification:', error);
    return {
      success: false,
      message: 'Network error during verification',
    };
  }
};

export const resendVerification = async (
  email: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/user/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return false;
    }
    
    const response = await fetch(`${API_URL}/api/user/${userId}/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
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
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return false;
    }
    
    const { username, ...allowedUpdates } = userData;
    
    const response = await fetch(`${API_URL}/api/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(allowedUpdates)
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

export const createGuestUser = async (): Promise<User> => {
  try {
    const response = await fetch(`${API_URL}/api/user/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success && data.token) {
      sessionStorage.setItem('auth_token', data.token);
    }
    
    return data.user;
  } catch (error) {
    console.error('Error creating guest user:', error);
    return {
      id: `guest-${Date.now()}`,
      email: '',
      username: `Guest-${Math.floor(Math.random() * 10000)}`,
      verified: false,
      isGuest: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        notificationsEnabled: true,
        theme: 'light',
        language: 'en'
      }
    };
  }
};

export const getUserProfile = async (): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/api/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
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
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      return { success: false, sessions: [] };
    }
    
    const data = await response.json();
    
    if (data.success && data.sessions) {
      return { success: true, sessions: data.sessions };
    }
    
    return { success: false, sessions: [] };
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return { success: false, sessions: [] };
  }
};