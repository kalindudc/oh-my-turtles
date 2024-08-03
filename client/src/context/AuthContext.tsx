import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import logger from '../utils/logger';
import { requestApiKey } from '../utils/api';

interface AuthContextProps {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => void;
  logout: () => void;
  checkAuthentication: () => Promise<void>;
  user: { username: string, api_key: string | null } | null;
  refreshApiKey: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string, api_key: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (response.ok) {
        setIsAuthenticated(true);
        logger.log('Logged in successfully!');
        const data = await response.json();
        const key = await requestApiKey();

        setUser({ username: data.username, api_key: key });
      } else {
        const errorData = await response.json();
        logger.error(`Login failed: ${errorData.message}`);
      }
    } catch (error) {
      logger.error(`Login error: ${error}`);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setIsAuthenticated(false);
        setUser(null);
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkAuthentication = useCallback(async () => {
    if (user || isAuthenticated) {
      return;
    }

    try {
      const response = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include', // Include cookies for session management
      });

      if (response.ok) {
        setIsAuthenticated(true);
        const data = await response.json();
        const key = data.apiKey ? data.apiKey : await requestApiKey();
        setUser({ username: data.username, api_key: key });
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshApiKey = async () => {
    try {
      const key = await requestApiKey();
      if (key) {
        const username = user?.username;
        if (!username) {
           throw Error('No username found');
        }
        setUser({ username: username, api_key: key });
      }
    } catch (error) {
      console.error('Error refreshing API key:', error);
    }
  };


  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, checkAuthentication, user, refreshApiKey }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for accessing user context
export const useUser = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
