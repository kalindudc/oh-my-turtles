import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
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
        <div className="app">
          <div className="background"></div>
          <AppContent />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="content">
      {isAuthenticated ? (
        <MainContent />
      ) : (
        <>
          <div className="skeleton-content">
            <SkeletonMainContent />
          </div>
          <div className="login-form">
            <LoginForm />
          </div>
        </>
      )}
    </div>
  );
};

export default App;
