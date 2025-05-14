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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAuthCheck, setLastAuthCheck] = useState<number>(0);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const storedName = localStorage.getItem('neighborville_playerName');
      const storedGuestFlag = localStorage.getItem('neighborville_is_guest');
      
      const userData = await getCurrentUser();
      
      if (userData) {
        setUser(userData);
        setIsGuest(!!userData.isGuest);
        
        localStorage.setItem('neighborville_playerName', userData.username);
        localStorage.setItem('neighborville_is_guest', userData.isGuest ? 'true' : 'false');
        
        setLastAuthCheck(Date.now());
        setIsLoading(false);
        return true;
      } else if (storedName) {
        setIsGuest(true);
        localStorage.setItem('neighborville_is_guest', 'true');
        
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
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      const storedName = localStorage.getItem('neighborville_playerName');
      if (storedName) {
        setIsGuest(true);
        localStorage.setItem('neighborville_is_guest', 'true');
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
    
    if (newUser.username) {
      localStorage.setItem('neighborville_playerName', newUser.username);
    }
    
    localStorage.setItem('neighborville_is_guest', newUser.isGuest ? 'true' : 'false');
    setLastAuthCheck(Date.now());
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('neighborville_playerName');
    localStorage.removeItem('neighborville_is_guest');
  };

  const createGuest = async () => {
    const guestUser = await createGuestUser();
    setUser(guestUser);
    setIsGuest(true);
    
    if (guestUser.username) {
      localStorage.setItem('neighborville_playerName', guestUser.username);
    }
    
    localStorage.setItem('neighborville_is_guest', 'true');
    return guestUser;
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
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 