import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useUser } from '../context/AuthContext';
import useAuth from '../hooks/useAuth';


const MainContent: React.FC = () => {
  const { user } = useUser();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4">Welcome to the main content {user?.username}!</Typography>
      <Button variant="contained" color="secondary" onClick={handleLogout}>
        Logout
      </Button>
    </Box>
  );
};

export default MainContent;
