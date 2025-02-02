import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { WebSocketProvider } from './context/WebSocketContext';
import useAuth from './hooks/useAuth';
import LoginForm from './components/LoginForm';
import MainContent from './components/MainContent';
import SkeletonMainContent from './components/SkeletonMainContent';
import './styles/App.css';

const theme = createTheme({
  palette: {
    background: {
      default: "#f2ede8"
    }
  }
});
const darkTheme = createTheme({
  palette: {
    mode: 'dark',

  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DataProvider>
          <WebSocketProvider>
            <div className="app">
              <div className="background"></div>
              <AppContent />
            </div>
          </WebSocketProvider>
        </DataProvider>
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
