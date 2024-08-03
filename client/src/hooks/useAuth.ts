import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const { isAuthenticated, isLoading, login, logout, checkAuthentication } = context;

  useEffect(() => {
    checkAuthentication();
  }, [checkAuthentication]);

  return { isAuthenticated, isLoading, login, logout };
};

export default useAuth;
