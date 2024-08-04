import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Machine } from '../context/MachineContext';
import TurtleHUD from './huds/TurtleHUD';

interface MachineComponentProps {
  machine: Machine;
  ws: WebSocket | null;
}

const MachineComponent: React.FC<MachineComponentProps> = ({ machine, ws }) => {
  const renderHUD = () => {
    switch (machine.type) {
      case 'turtle':
        return <TurtleHUD machine={machine} ws={ws} />;

      default:
        return null;
    }
  };

  return (
    <Box position="relative" width="100%" height="100%">
      {/* Main View */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h4">{machine.name}</Typography>
        <Typography variant="subtitle1">{machine.type}</Typography>
        <Typography variant="body1">World: {machine.world_id}</Typography>
      </Box>

      {/* HUD Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100%',
          height: '100%',
          margin: '0',
          padding: '0',
        }}
      >
        {renderHUD()}
      </Box>
    </Box>
  );
};

export default MachineComponent;
