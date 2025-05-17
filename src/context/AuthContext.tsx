import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useRef } from 'react';
import type { User } from '../services/userService';
import { getCurrentUser, logout as logoutUser } from '../services/userService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  checkAuthStatus: () => Promise<boolean>;
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
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

const saveToSession = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value);
  } catch (e) {
    console.warn('Failed to save to sessionStorage', e);
  }
};

const getFromSession = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch (e) {
    console.warn('Failed to get from sessionStorage', e);
    return null;
  }
};

const removeFromSession = (key: string) => {
  try {
    sessionStorage.removeItem(key);
  } catch (e) {
    console.warn('Failed to remove from sessionStorage', e);
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAuthCheck, setLastAuthCheck] = useState<number>(0);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const authCheckTimeoutRef = useRef<number | null>(null);
  
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const abortController = new AbortController();
      const timeoutId = window.setTimeout(() => {
        abortController.abort();
        console.warn('Auth check timed out after 10 seconds');
      }, 10000);
      
      let userData: User | null = null;
      
      try {
        userData = await getCurrentUser();
        window.clearTimeout(timeoutId);
      } catch (e) {
        window.clearTimeout(timeoutId);
        console.error('Error fetching user data:', e);
      }
      
      if (userData) {
        setUser(userData);
        saveToSession('neighborville_playerName', userData.username);
        setLastAuthCheck(Date.now());
        setIsLoading(false);
        return true;
      } else {
        console.log('No user data found, setting user to null');
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error in checkAuth:', error);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  }, []);
  
  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('Unauthorized event detected, clearing user state');
      setUser(null);
      setShowLogin(true);
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);
  
  useEffect(() => {
    checkAuth();
    
    return () => {
      if (authCheckTimeoutRef.current) {
        window.clearTimeout(authCheckTimeoutRef.current);
      }
    };
  }, [checkAuth]);
  
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    if (Date.now() - lastAuthCheck < 60000) {
      return !!user;
    }
    
    return await checkAuth();
  }, [checkAuth, lastAuthCheck, user]);

  useEffect(() => {
    const refreshInterval = setInterval(refreshAuth, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [refreshAuth]);

  const login = useCallback((newUser: User) => {
    if (!newUser || !newUser.id) {
      console.error('Invalid user data provided to login:', newUser);
      return;
    }
    
    console.log('Setting user in context:', newUser.username);
    setUser(newUser);
    setShowLogin(false);
    
    if (newUser.username) {
      saveToSession('neighborville_playerName', newUser.username);
    }
    
    setLastAuthCheck(Date.now());
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error('Error during logout:', e);
    }
    
    setUser(null);
    removeFromSession('neighborville_playerName');
    removeFromSession('neighborville_auth_token');
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshAuth,
        checkAuthStatus,
        showLogin,
        setShowLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 