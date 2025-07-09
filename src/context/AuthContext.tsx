import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useRef } from 'react';
import type { User } from '../services/userService';
import { getCurrentUser, logout as logoutUser, isRememberMeEnabled } from '../services/userService';
import socketService from '../services/socketService';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
  forceRefresh: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  checkAuthStatus: () => Promise<boolean>;
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
  socketStatus: 'connecting' | 'connected' | 'disconnected';
  isSocketAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const saveToStorage = (key: string, value: string, persistent: boolean = false) => {
  try {
    if (persistent && isRememberMeEnabled()) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  } catch (e) {
    logger.warn('Failed to save to storage', e);
  }
};

const getFromStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  } catch (e) {
    logger.warn('Failed to get from storage', e);
    return null;
  }
};

const removeFromStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch (e) {
    logger.warn('Failed to remove from storage', e);
  }
};

const checkCookieAuth = (): boolean => {
  return true;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAuthCheck, setLastAuthCheck] = useState<number>(0);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isSocketAuthenticated, setIsSocketAuthenticated] = useState(false);
  const authCheckTimeoutRef = useRef<number | null>(null);
  const initializationComplete = useRef(false);
  
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const abortController = new AbortController();
      const timeoutId = window.setTimeout(() => {
        abortController.abort();
        console.warn('Auth check timed out after 10 seconds');
      }, 10000);
      
      let userData: User | null = null;
      let authFailed = false;
      
      try {
        console.log('Checking authentication status...');
        userData = await getCurrentUser();
        window.clearTimeout(timeoutId);
        console.log('Auth check result:', userData ? `User: ${userData.username}` : 'No user');
      } catch (e) {
        window.clearTimeout(timeoutId);
        console.error('Error fetching user data:', e);
        
        if (e instanceof Error && e.message.includes('401')) {
          console.log('Received 401 - authentication failed');
          authFailed = true;
        } else {
          console.warn('Auth check failed with non-401 error, keeping existing user state if available');
          if (initializationComplete.current) {
            console.log('Keeping existing user due to non-auth error');
            setIsLoading(false);
            return true;
          }
        }
      }
      
      if (userData) {
        console.log('Setting authenticated user:', userData.username);
        setUser(userData);
        saveToStorage('neighborville_playerName', userData.username, isRememberMeEnabled());
        setLastAuthCheck(Date.now());
        setIsLoading(false);
        initializationComplete.current = true;
        return true;
      } else if (authFailed) {
        console.log('Clearing user state due to auth failure');
        setUser(null);
        setIsLoading(false);
        initializationComplete.current = true;
        return false;
      } else {
        if (initializationComplete.current) {
          console.log('No user data and already initialized - clearing user state');
          setUser(null);
          setIsLoading(false);
          return false;
        } else {
          console.log('No user data during initialization - keeping existing state');
          setIsLoading(false);
          return false;
        }
      }
    } catch (error) {
      console.error('Error in checkAuth:', error);
      if (initializationComplete.current) {
        console.log('Keeping existing user due to general error');
        setIsLoading(false);
        return true;
      }
      setUser(null);
      setIsLoading(false);
      initializationComplete.current = true;
      return false;
    }
  }, []);
  
  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('Unauthorized event detected, clearing user state');
      setUser(null);
      setShowLogin(true);
    };
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeSinceLastCheck = Date.now() - lastAuthCheck;
        if (timeSinceLastCheck > 2 * 60 * 1000) {
          logger.debug('Tab became visible after', Math.floor(timeSinceLastCheck / 1000), 'seconds, checking auth');
          refreshAuth().catch(error => {
            logger.warn('Auth refresh failed on visibility change:', error);
          });
        }
      }
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastAuthCheck]);
  
  useEffect(() => {
    checkAuth();
    
    return () => {
      if (authCheckTimeoutRef.current) {
        window.clearTimeout(authCheckTimeoutRef.current);
      }
    };
  }, []);
  
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    if (Date.now() - lastAuthCheck < 30000) {
      return true;
    }
    
    try {
      return await checkAuth();
    } catch (error) {
      console.warn('Auth refresh failed, keeping existing state:', error);
      return false;
    }
  }, [checkAuth, lastAuthCheck]);

  useEffect(() => {
    console.log('🔌 Setting up socket connection management');
    
    const handleConnect = () => {
      console.log('🔗 Socket connected');
      setSocketStatus('connected');
      
      const token = getFromStorage('token') || localStorage.getItem('token');
      if (token) {
        console.log('🔐 Authenticating socket immediately on connect');
        socketService.authenticate(token);
      }
    };
    
    const handleDisconnect = (reason?: string) => {
      console.log('🔌 Socket disconnected, reason:', reason);
      setSocketStatus('disconnected');
      setIsSocketAuthenticated(false);
      
      if (user && reason !== 'io client disconnect') {
        console.log('🔄 User still logged in, socket will auto-reconnect');
        setSocketStatus('connecting');
      }
    };
    
    const handleAuthenticated = () => {
      console.log('✅ Socket authenticated');
      setIsSocketAuthenticated(true);
    };
    
    const handleAuthError = () => {
      console.log('❌ Socket authentication error');
      setIsSocketAuthenticated(false);
    };
    
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('authenticated', handleAuthenticated);
    socketService.on('auth_error', handleAuthError);
    
    socketService.connect();
    setSocketStatus('connecting');
    
    return () => {
      console.log('🔌 Cleaning up socket event listeners');
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('authenticated', handleAuthenticated);
      socketService.off('auth_error', handleAuthError);
    };
  }, []);

  useEffect(() => {
    if (user && socketStatus === 'connected' && !isSocketAuthenticated) {
      console.log('🔐 Authenticating socket for user:', user.username);
      const token = getFromStorage('token') || localStorage.getItem('token');
      if (token) {
        socketService.authenticate(token);
      }
    } else if (!user && isSocketAuthenticated) {
      console.log('🚪 User logged out, socket will disconnect on next auth check');
      setIsSocketAuthenticated(false);
    }
  }, [user, socketStatus, isSocketAuthenticated]);

  const forceRefresh = useCallback(async (): Promise<boolean> => {
    console.log('Force refreshing user data...');
    return await checkAuth();
  }, [checkAuth]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(currentUser => {
      if (currentUser) {
        const updatedUser = { ...currentUser, ...userData };
        console.log('Updating user in context:', updatedUser);
        return updatedUser;
      }
      return currentUser;
    });
  }, []);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (Date.now() - lastAuthCheck > 5 * 60 * 1000) {
        refreshAuth();
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [lastAuthCheck, refreshAuth]);

  const login = useCallback((newUser: User) => {
    if (!newUser || !newUser.id) {
      console.error('Invalid user data provided to login:', newUser);
      return;
    }
    
    console.log('Setting user in context:', newUser.username);
    setUser(newUser);
    setShowLogin(false);
    
    if (newUser.username) {
      saveToStorage('neighborville_playerName', newUser.username, isRememberMeEnabled());
    }
    
    setLastAuthCheck(Date.now());
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Error during logout:', e);
    }
    
    console.log('🚪 Logging out - disconnecting socket');
    socketService.disconnect();
    setSocketStatus('disconnected');
    setIsSocketAuthenticated(false);
    
    setUser(null);
    removeFromStorage('neighborville_playerName');
    removeFromStorage('neighborville_auth_token');
    removeFromStorage('token');
    document.cookie = 'neighborville_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    setShowLogin(true);
  }, []);

  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      const userData = await getCurrentUser();
      return !!userData;
    } catch (error) {
      console.error('Error verifying auth status:', error);
      return false;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshAuth,
    forceRefresh,
    updateUser,
    checkAuthStatus,
    refreshUser,
    showLogin,
    setShowLogin,
    socketStatus,
    isSocketAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 