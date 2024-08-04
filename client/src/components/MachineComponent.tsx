import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Machine, useMachines } from '../context/MachineContext';
import TurtleHUD from './huds/TurtleHUD';

interface MachineComponentProps {
  machineID: string;
  ws: WebSocket | null;
}

const MachineComponent: React.FC<MachineComponentProps> = ({ machineID, ws }) => {
  const { machines } = useMachines();
  const machine = machines.find((m: Machine) => m.id === machineID) || {
    id: '',
    name: 'INVALID___',
    type: '',
    world_id: '',
    connected: false,
    x: 0,
    y: 0,
    z: 0,
    facing: '',
    fuel: 0,
    inventory: [],
  };

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
        Content
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
