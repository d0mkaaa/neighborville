import { NORMALIZED_API_URL, buildApiEndpoint } from '../config/apiConfig';

export interface User {
  id: string;
  email: string;
  username: string;
  verified: boolean;
  role?: 'user' | 'moderator' | 'admin';
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
  legalAcceptance?: {
    termsOfService?: {
      accepted: boolean;
      version?: string;
      acceptedAt?: string | Date;
      ipAddress?: string;
    };
    privacyPolicy?: {
      accepted: boolean;
      version?: string;
      acceptedAt?: string | Date;
      ipAddress?: string;
    };
    marketingConsent?: {
      accepted: boolean;
      acceptedAt?: string | Date;
      ipAddress?: string;
    };
  };
  isGuest?: boolean;
  createdAt?: string | Date;
  lastLogin?: string | Date;
  lastSave?: string | Date;
  isSuspended?: boolean;
  activeSuspension?: {
    id: string;
    reason: string;
    startDate: string;
    endDate: string;
    issuedBy: string;
    timeRemaining: number;
    isPermanent: boolean;
    canAppeal: boolean;
    appeal: {
      id: string;
      reason: string;
      status: 'pending' | 'approved' | 'denied';
      submittedAt: string;
      adminResponse?: string;
    } | null;
  } | null;
  suspensionCount?: number;
  warningCount?: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export const saveAuthToken = (token: string, rememberMe: boolean = false): void => {
  if (!token) {
    console.warn('Attempted to save null/empty token');
    return;
  }
  try {
    const expiryDate = new Date();
    if (rememberMe) {
      expiryDate.setDate(expiryDate.getDate() + 30);
    } else {
      expiryDate.setDate(expiryDate.getDate() + 7);
    }
    
    const isSecure = window.location.protocol === 'https:';
    const cookieFlags = `expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    document.cookie = `neighborville_auth=${token}; ${cookieFlags}`;
    
    if (rememberMe) {
      localStorage.setItem('neighborville_auth_token', token);
      localStorage.setItem('neighborville_auth_expiry', expiryDate.toISOString());
      localStorage.setItem('neighborville_remember_me', 'true');
    } else {
      localStorage.removeItem('neighborville_auth_token');
      localStorage.removeItem('neighborville_auth_expiry');
      localStorage.removeItem('neighborville_remember_me');
    }
    
    sessionStorage.setItem('neighborville_auth_token', token);
    sessionStorage.setItem('neighborville_auth_expiry', expiryDate.toISOString());
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

export const getAuthToken = (): string | null => {
  try {
    let token = null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'neighborville_auth' && value) {
        token = value;
        break;
      }
    }
    
    if (!token) {
      const storedToken = localStorage.getItem('neighborville_auth_token');
      const storedExpiry = localStorage.getItem('neighborville_auth_expiry');
      const rememberMe = localStorage.getItem('neighborville_remember_me') === 'true';
      
      if (storedToken && storedExpiry && rememberMe) {
        const expiryDate = new Date(storedExpiry);
        if (expiryDate > new Date()) {
          token = storedToken;
          saveAuthToken(token, true);
        } else {
          localStorage.removeItem('neighborville_auth_token');
          localStorage.removeItem('neighborville_auth_expiry');
          localStorage.removeItem('neighborville_remember_me');
        }
      }
    }

    if (!token) {
      const sessionToken = sessionStorage.getItem('neighborville_auth_token');
      const sessionExpiry = sessionStorage.getItem('neighborville_auth_expiry');
      
      if (sessionToken && sessionExpiry) {
        const expiryDate = new Date(sessionExpiry);
        if (expiryDate > new Date()) {
          token = sessionToken;
        } else {
          sessionStorage.removeItem('neighborville_auth_token');
          sessionStorage.removeItem('neighborville_auth_expiry');
        }
      }
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
    const isSecure = window.location.protocol === 'https:';
    const cookieFlags = `expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`;
    document.cookie = `neighborville_auth=; ${cookieFlags}`;
    
    localStorage.removeItem('neighborville_auth_token');
    localStorage.removeItem('neighborville_auth_expiry');
    localStorage.removeItem('neighborville_remember_me');
    
    sessionStorage.removeItem('neighborville_auth_token');
    sessionStorage.removeItem('neighborville_auth_expiry');
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
    const response = await fetch(buildApiEndpoint('/api/user/register'), {
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
    const checkUser = await fetch(buildApiEndpoint('/api/user/check-registered'), {
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
    
    const response = await fetch(buildApiEndpoint('/api/user/login'), {
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
    const response = await fetch(buildApiEndpoint('/api/user/logout'), {
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

export const getCurrentJWTToken = async (): Promise<string | null> => {
  try {
    const response = await fetch(buildApiEndpoint('/api/user/token'), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('getCurrentJWTToken: Error getting JWT token:', error);
    return null;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await fetch(buildApiEndpoint('/api/user/me'), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('getCurrentUser: Error getting current user:', error);
    return null;
  }
};

export const checkRegisteredEmail = async (
  email: string
): Promise<{ exists: boolean; message?: string }> => {
  try {
    const response = await fetch(buildApiEndpoint('/api/user/check-registered'), {
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
    const response = await fetch(buildApiEndpoint('/api/user/verify'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, code, username })
    });

    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        message: data.message || 'Verification failed'
      };
    }

    if (data.token) {
      saveAuthToken(data.token);
      
      if (username || (data.user && data.user.username)) {
        const usernameToBeSaved = username || data.user.username;
        sessionStorage.setItem('neighborville_playerName', usernameToBeSaved);
      }
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
    const response = await fetch(buildApiEndpoint('/api/user/resend-verification'), {
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
    const response = await fetch(buildApiEndpoint(`/api/user/${userId}/settings`), {
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
    
    const response = await fetch(buildApiEndpoint(`/api/user/${userId}`), {
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
    const response = await fetch(buildApiEndpoint('/api/user/profile'), {
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
    const response = await fetch(buildApiEndpoint('/api/user/sessions'), {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return { success: false, sessions: [], message: 'Failed to load sessions' };
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
      buildApiEndpoint(`/api/user/leaderboard?sort=${sort}&page=${page}&limit=${limit}`),
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
    neighborhoodName?: string;
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
  extendedProfile?: {
    bio?: string;
    location?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      github?: string;
      instagram?: string;
      linkedin?: string;
    };
    interests?: string[];
    gamePreferences?: {
      favoriteBuilding?: string;
      playStyle?: string;
    };
  } | null;
  showBio: boolean;
  showStats: boolean;
  showActivity: boolean;
  showSocialLinks: boolean;
  showAchievements: boolean;
}

export const getPublicProfile = async (username: string): Promise<{
  success: boolean;
  profile?: PublicProfileData;
  isPrivate?: boolean;
  message?: string;
}> => {
  try {
    const response = await fetch(buildApiEndpoint(`/api/profile/${username}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      try {
        const error = await response.json();
        return {
          success: false,
          isPrivate: error.isPrivate || false,
          message: error.message || `Failed to fetch profile: ${response.status}`
        };
      } catch {
        return {
          success: false,
          message: `Failed to fetch profile: ${response.status}`
        };
      }
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

export const checkAuthenticationStatus = async (): Promise<{
  success: boolean;
  authenticated: boolean;
  user?: User;
  message?: string;
  hasSaves?: boolean;
  saveCount?: number;
}> => {
  try {
    const response = await fetch(buildApiEndpoint('/api/user/auth-check'), {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return {
      success: false,
      authenticated: false,
      message: 'Error checking authentication status'
    };
  }
};

export interface LegalAcceptanceRequest {
  termsOfService?: boolean;
  privacyPolicy?: boolean;
  marketingConsent?: boolean;
  version?: string;
}

export interface LegalAcceptanceResponse {
  success: boolean;
  message?: string;
  legalAcceptance?: {
    termsOfService?: {
      accepted: boolean;
      version?: string;
      acceptedAt?: string | Date;
      ipAddress?: string;
    };
    privacyPolicy?: {
      accepted: boolean;
      version?: string;
      acceptedAt?: string | Date;
      ipAddress?: string;
    };
    marketingConsent?: {
      accepted: boolean;
      acceptedAt?: string | Date;
      ipAddress?: string;
    };
  };
}

export const updateLegalAcceptance = async (acceptance: LegalAcceptanceRequest): Promise<LegalAcceptanceResponse> => {
  try {
    const response = await fetch(buildApiEndpoint('/api/user/legal-acceptance'), {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(acceptance)
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to update legal acceptance'
      };
    }

    return data;
  } catch (error) {
    console.error('Error updating legal acceptance:', error);
    return {
      success: false,
      message: typeof error === 'string' ? error : error instanceof Error ? error.message : 'Failed to update legal acceptance'
    };
  }
};

export const getLegalAcceptance = async (): Promise<LegalAcceptanceResponse> => {
  try {
    const response = await fetch(buildApiEndpoint('/api/user/legal-acceptance'), {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to fetch legal acceptance'
      };
    }

    return data;
  } catch (error) {
    console.error('Error fetching legal acceptance:', error);
    return {
      success: false,
      message: typeof error === 'string' ? error : error instanceof Error ? error.message : 'Failed to fetch legal acceptance'
    };
  }
};

export const checkLegalAcceptanceRequired = (user: User | null): boolean => {
  if (!user) return false;
  
  const legalAcceptance = user.legalAcceptance;
  
  if (!legalAcceptance) return true;
  
  const termsAccepted = legalAcceptance.termsOfService?.accepted === true;
  const privacyAccepted = legalAcceptance.privacyPolicy?.accepted === true;
  
  return !(termsAccepted && privacyAccepted);
};

export const isRememberMeEnabled = (): boolean => {
  try {
    return localStorage.getItem('neighborville_remember_me') === 'true';
  } catch (error) {
    return false;
  }
};

export const getTokenExpiryDate = (): Date | null => {
  try {
    const expiry = localStorage.getItem('neighborville_auth_expiry') || 
                   sessionStorage.getItem('neighborville_auth_expiry');
    return expiry ? new Date(expiry) : null;
  } catch (error) {
    return null;
  }
};

export const isTokenExpired = (): boolean => {
  const expiryDate = getTokenExpiryDate();
  return expiryDate ? expiryDate <= new Date() : true;
};

export const check2FAStatus = async (email: string): Promise<{ enabled: boolean; verified: boolean }> => {
  try {
    console.log('userService: Calling check-2fa-status with email:', email);
    console.log('userService: Request body:', { email });
    
    const response = await fetch(buildApiEndpoint('/api/user/check-2fa-status'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    throw error;
  }
};