import React, { useState } from 'react';
import { Box } from '@mui/material';

import useAuth from '../hooks/useAuth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Machine } from '../context/DataContext';
import MachineComponent from './MachineComponent';
import { useWebSocket } from '../context/WebSocketContext';

const MainContent: React.FC = () => {
  const { logout } = useAuth();
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const { ws } = useWebSocket();

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <Box component="div"
      display='flex'
      flexDirection='column'
      justifyContent='flex-start'
      alignItems='flex-start'
      width='100%'
      height='100%'
    >
      <Navbar />
      <Box component="div"
        display='flex'
        justifyContent='space-between'
        alignItems='flex-start'
        width='100%'
        height='100%'
      >
        <Box component="div"
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
          <Sidebar onSelect={(machine: Machine) => setSelectedMachine(machine)} />
        </Box>
        <Box component="div"
          display='flex'
          width='100%'
          height='100%'
          justifyContent='center'
          alignItems='center'
          bgcolor='#f2ede8'
        >
          {selectedMachine ? (
            <MachineComponent machineID={selectedMachine.id} ws={ws} onSelect={(machine: Machine) => setSelectedMachine(machine)} />
          ) : (
            <div>Select a machine</div>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MainContent;
