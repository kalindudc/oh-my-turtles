import React, { useState, useEffect } from 'react';
import { Box, Button, Grid, Paper } from '@mui/material';

import { Machine } from '../../context/MachineContext';
import ScreenLine from '../SceenLine';
import { useWebSocket, createClientPayload } from '../../context/WebSocketContext';
import { useUser } from '../../context/AuthContext';

interface TurtleHUDProps {
  machine: Machine;
  ws: WebSocket | null;
}

enum TurtleCommands {
  FORWARD = 'forward',
  BACKWARD = 'backward',
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down'
}

const TurtleHUD: React.FC<TurtleHUDProps> = ({ machine, ws }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const { sendMessage } = useWebSocket();
  const { user } = useUser();

  const sendCommand = (command : string) => {
    const payload = createClientPayload({command : command, machine_id : machine.id}, user?.api_key);
    sendMessage(JSON.stringify(payload));
  };

  const formatMessage = (message: string) => {
    const currentDateTime = new Date().toLocaleString();
    const formattedMessage = `[${currentDateTime}] - ${message}`;
    return formattedMessage;
  }

  useEffect(() => {
    if (!ws) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      setMessages((prevMessages) => [formatMessage(message), ...prevMessages]);
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={1}
      width="100%"
      height="100%"
      justifyContent="space-between"
      alignItems="center"
    >
      <Box
        display="flex"
        flexDirection="row"
        gap={1}
        width="100%"
        height="20%"
        minHeight="200px"
      >
        <ScreenLine messages={messages} />
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        gap={1}
        width="100%"
        minHeight="300px"
        padding="0.5rem"
      >
        <Box
          display="flex"
          flexDirection="column"
          gap={1}
          width="100%"
          height="100%"
          justifyContent="center"
          alignItems="center"
          sx={{
            border: '0.05rem solid #ccc',
          }}
          p="1rem"
        >
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Button variant="outlined" onClick={() => sendCommand(TurtleCommands.FORWARD)}>Forward</Button>
            </Grid>
            <Grid item xs={4}>
              <Button variant="outlined" onClick={() => sendCommand(TurtleCommands.BACKWARD)}>Back</Button>
            </Grid>
            <Grid item xs={4}>
              <Button variant="outlined" onClick={() => sendCommand(TurtleCommands.UP)}>Up</Button>
            </Grid>

            <Grid item xs={4}>
              <Button variant="outlined" onClick={() => sendCommand(TurtleCommands.LEFT)}>Left</Button>
            </Grid>
            <Grid item xs={4}>
              <Button variant="outlined" onClick={() => sendCommand(TurtleCommands.RIGHT)}>Right</Button>
            </Grid>
            <Grid item xs={4}>
              <Button variant="outlined" onClick={() => sendCommand(TurtleCommands.DOWN)}>Down</Button>
            </Grid>
          </Grid>
        </Box>
        <Box
          display="flex"
          flexDirection="column"
          gap={1}
          minWidth="300px"
          height="100%"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            border: '0.05rem solid #ccc',
          }}
        >

        </Box>
      </Box>
    </Box>
  );
};

export default TurtleHUD;
