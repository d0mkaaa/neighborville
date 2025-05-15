import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../services/userService';
import { getCurrentUser, logout as logoutUser, createGuestUser } from '../services/userService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  createGuest: () => Promise<User>;
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
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);

  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const storedName = getFromSession('neighborville_playerName');
      const storedGuestFlag = getFromSession('neighborville_is_guest');
      
      const userData = await getCurrentUser();
      
      if (userData) {
        setUser(userData);
        setIsGuest(!!userData.isGuest);
        
        saveToSession('neighborville_playerName', userData.username);
        saveToSession('neighborville_is_guest', userData.isGuest ? 'true' : 'false');
        
        setLastAuthCheck(Date.now());
        setIsLoading(false);
        return true;
      } else if (storedName) {
        setIsGuest(true);
        saveToSession('neighborville_is_guest', 'true');
        
        setUser({
          id: `local-${Date.now()}`,
          username: storedName,
          email: '',
          verified: false,
          isGuest: true
        });
        
        setLastAuthCheck(Date.now());
        setIsLoading(false);
        return true;
      } else {
        setUser(null);
        setIsGuest(false);
        setShowLogin(true);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      const storedName = getFromSession('neighborville_playerName');
      if (storedName) {
        setIsGuest(true);
        saveToSession('neighborville_is_guest', 'true');
        setUser({
          id: `local-${Date.now()}`,
          username: storedName,
          email: '',
          verified: false,
          isGuest: true
        });
      } else {
        setUser(null);
        setIsGuest(false);
        setShowLogin(true);
      }
      setIsLoading(false);
      return !!storedName;
    }
  };
  
  const refreshAuth = async (): Promise<boolean> => {
    if (Date.now() - lastAuthCheck < 60000) {
      return !!user;
    }
    
    return await checkAuth();
  };

  useEffect(() => {
    const refreshInterval = setInterval(refreshAuth, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  const login = (newUser: User) => {
    setUser(newUser);
    setIsGuest(!!newUser.isGuest);
    setShowLogin(false);
    
    if (newUser.username) {
      saveToSession('neighborville_playerName', newUser.username);
    }
    
    saveToSession('neighborville_is_guest', newUser.isGuest ? 'true' : 'false');
    setLastAuthCheck(Date.now());
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setIsGuest(false);
    removeFromSession('neighborville_playerName');
    removeFromSession('neighborville_is_guest');
    setShowLogin(true);
  };

  const createGuest = async () => {
    const guestUser = await createGuestUser();
    setUser(guestUser);
    setIsGuest(true);
    setShowLogin(false);
    
    if (guestUser.username) {
      saveToSession('neighborville_playerName', guestUser.username);
    }
    
    saveToSession('neighborville_is_guest', 'true');
    return guestUser;
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const userData = await getCurrentUser();
      return !!userData && !userData.isGuest;
    } catch (error) {
      console.error('Error verifying auth status:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !isGuest,
        isGuest,
        login,
        logout,
        createGuest,
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