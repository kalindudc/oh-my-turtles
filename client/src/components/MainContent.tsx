import React from 'react';
import { Box } from '@mui/material';

import useAuth from '../hooks/useAuth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainContent: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <Box
      display='flex'
      flexDirection='column'
      justifyContent='flex-start'
      alignItems='flex-start'
      width='100%'
      height='100%'
    >
      <Navbar />
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='flex-start'
        width='100%'
        height='100%'
      >
        <Box
          display='flex'
          width='25%'
          minWidth='300px'
          height='100%'
          flexDirection='column'
          justifyContent='flex-start'
          alignItems='flex-start'
          borderRight='1px solid #ccc'
          p="1, 0, 1, 0"
          bgcolor='#e5e1db'
          sx={{
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Sidebar />
        </Box>
        <Box
          display='flex'
          width='100%'
          height='100%'
          justifyContent='center'
          alignItems='center'
          bgcolor='#f2ede8'
        >
          Context
        </Box>
      </Box>
    </Box>
  );
};

export default MainContent;
