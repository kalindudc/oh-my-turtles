import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Machine, useData } from '../context/DataContext';
import TurtleHUD from './huds/TurtleHUD';
import ThreeJSWorld from './three_js/ThreeJsWorld';

interface MachineComponentProps {
  machineID: string;
  ws: WebSocket | null;
  onSelect: (machine: Machine) => void;
}

const MachineComponent: React.FC<MachineComponentProps> = ({ machineID, ws, onSelect }) => {
  const { machines, worlds } = useData();
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
  const world = worlds.find((w) => w.id === machine.world_id) || { id: '', name: 'INVALID___', blocks: [] };

  const renderHUD = () => {
    switch (machine.type) {
      case 'turtle':
        return <TurtleHUD machine={machine} ws={ws} />;

      default:
        return null;
    }
  };

  return (
    <Box component="div" position="relative" width="100%" height="100%">
      {/* Main View */}
      <Box component="div"
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ThreeJSWorld blocks={world.blocks} machine={machine} onSelect={onSelect} />
      </Box>


      {/* HUD Controls */}
      <Box
        component="div"
        className="click-through"
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
