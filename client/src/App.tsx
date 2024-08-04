import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { MachineProvider } from './context/MachineContext';
import { WebSocketProvider } from './context/WebSocketContext';
import useAuth from './hooks/useAuth';
import LoginForm from './components/LoginForm';
import MainContent from './components/MainContent';
import SkeletonMainContent from './components/SkeletonMainContent';
import './styles/App.css';

const theme = createTheme();

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <MachineProvider>
          <WebSocketProvider>
            <div className="app">
              <div className="background"></div>
              <AppContent />
            </div>
          </WebSocketProvider>
        </MachineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth(); // Get the loading state
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsInitialized(true); // Set initialized to true once loading is complete
    }
  }, [isLoading]);

  if (!isInitialized) {
    return (
      <div className="loading">
        <SkeletonMainContent />
      </div>
    );
  }

  return (
    <div className="content">
      {isAuthenticated ? (
        <MainContent />
      ) : (
        <div className="center-all">
          <LoginForm />
        </div>
      )}
    </div>
  );
};

export default App;
