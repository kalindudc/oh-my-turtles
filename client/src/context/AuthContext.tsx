import React, { createContext, useState, ReactNode } from 'react';

interface AuthContextProps {
  isAuthenticated: boolean;
  login: (username: string, password: string) => void;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (username: string, password: string) => {
    // Implement your authentication logic here
    if (username === 'user' && password === 'password') {
      setIsAuthenticated(true);
      console.log('Logged in!');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login }}>
      {children}
    </AuthContext.Provider>
  );
};
