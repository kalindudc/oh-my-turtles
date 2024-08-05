import React, { useState, useEffect } from 'react';
import { Box, Button, Grid, Tooltip, Typography, Snackbar,IconButton } from '@mui/material';
import {
  FastForward,
  FastRewind,
  ArrowDownward,
  ArrowUpward,
  TurnLeft,
  TurnRight,
  Visibility,
  PanTool,
  Delete,
  Add,
  Hardware,
  Close
} from '@mui/icons-material';

import { Machine } from '../../context/DataContext';
import ScreenLine from '../SceenLine';
import { useWebSocket, createClientPayload } from '../../context/WebSocketContext';
import { useUser } from '../../context/AuthContext';
import { TurtleCommands } from '../../enums/CommandEnum';
import NotificationStack, { Notification } from '../NotificationStack';
import { parse } from 'path';

interface TurtleHUDProps {
  machine: Machine;
  ws: WebSocket | null;
}

const TurtleHUD: React.FC<TurtleHUDProps> = ({ machine, ws }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

  const removeNotification = (id: number) => {
    setNotifications((prevNotifications) => prevNotifications.filter((notification) => notification.id !== id));
  };

  useEffect(() => {
    if (!ws) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const parsedMessage = JSON.parse(event.data);
      if (!parsedMessage.type || parsedMessage.type !== "command_result") {
        return;
      }

      if (!parsedMessage.payload || parsedMessage.payload.type !== "error") {
        return;
      }

      const error = parsedMessage.payload.error;
      const command = parsedMessage.payload.command;

      //setMessages((prevMessages) => [formatMessage(message), ...prevMessages]);

      const message = `Error: '${error}'`;
      const newNotification: Notification = { id: Date.now(), message: message };
      setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
    };

    ws.addEventListener('message', handleMessage);

    return () => {
      ws.removeEventListener('message', handleMessage);
    };
  }, [ws]);

  const renderControlButtonGroup = (group: Array<{command: string, title: string, icon: React.ReactNode,} | null>, color : "inherit" | "error" | "info" | "primary" | "secondary" | "success" | "warning" | undefined, width? : string) => {
    const minWidth = width ? width : "50px";
    return (
      <Box component="div"
        display="flex"
        flexDirection="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        height="100%"
        width={minWidth}
        gap={0.5}
      >
        {group.map((button, index) => {
          if (button) {
            return (
              <Tooltip title={button.title} placement="top-start" disableInteractive followCursor key={"group-" + index}>
                <Button
                  variant="outlined"
                  color={color}
                  sx={{
                    minWidth: {minWidth},
                    width: '100%',
                    height: '50px',
                  }}
                  onClick={() => sendCommand(button.command)}
                >
                  {button.icon}
                </Button>
              </Tooltip>
            );
          } else {
            return (
              <Box component="div" sx={{minWidth:"50px", height:"50px", width:"100%"}} key={"empty-" + index}></Box>
            );
          }
        })}
      </Box>
    );
  }

  return (
    <Box component="div"
      display="flex"
      flexDirection="column"
      gap={1}
      width="100%"
      height="100%"
      justifyContent="space-between"
      alignItems="center"
    >
      {/* TOP HUD */}
      <Box component="div"
        display="flex"
        flexDirection="row"
        gap={1}
        width="100%"
        height="20%"
        minHeight="200px"
        padding="0.5rem"
      >
        <Box component="div"
          display="flex"
          flexDirection="column"
          gap={0}
          minWidth="200px"
          height="100%"
          justifyContent="flex-start"
          alignItems="flx-start"
          p="0.5rem"
          sx={{
            border: '0.05rem solid #ccc',
            borderRadius: '4px',
          }}
        >
          <Typography variant="h4">{machine.name}</Typography>
          <Typography variant="subtitle1">{machine.type}</Typography>
          <Typography variant="body1">World: {machine.world_id}</Typography>
          <Typography variant="body1">Cords: {machine.x}, {machine.y}, {machine.z}</Typography>
          <Typography variant="body1">Facing: {machine.facing}</Typography>
          <Typography variant="body1">Fuel: {machine.fuel}</Typography>
        </Box>

        {/* <ScreenLine messages={messages} /> */}
      </Box>

      {/* BOTTOM HUD */}
      <Box component="div"
        display="flex"
        flexDirection="row"
        gap={1}
        width="100%"
        minHeight="300px"
        padding="0.5rem"
      >
        <Box component="div"
          display="flex"
          flexDirection="column"
          width="100%"
          height="100%"
          justifyContent="flex-start"
          alignItems="center"
          overflow="scroll"
          sx={{
            border: '0.05rem solid #ccc',
            borderRadius: '4px',
            background: "rgba(230,220,210,0.5)"
          }}
          gap={1}
          p={1}
        >
          {/* Control Buttons */}
          <Box component="div"
            className="interactive"
            display="flex"
            flexDirection="row"
            gap={1}
            width="100%"
            height="50%"
            justifyContent="center"
            alignItems="center"
          >
            commands
          </Box>

          {/* Command Buttons */}
          <Box component="div"
            className="interactive"
            display="flex"
            flexDirection="row"
            width="auto"
            gap={0.5}
            height="50%"
            justifyContent="center"
            alignItems="center"
          >
            {renderControlButtonGroup([
              null,
              {
                command: TurtleCommands.LEFT,
                title: "Turn Left",
                icon: <TurnLeft />,
              },
              null,
            ], "info")}
            {renderControlButtonGroup([
              {
                command: TurtleCommands.FORWARD,
                title: "Forward",
                icon: <FastForward />,
              },
              {
                command: TurtleCommands.DOWN,
                title: "Down",
                icon: <ArrowDownward />,
              },
              {
                command: TurtleCommands.BACKWARD,
                title: "Backward",
                icon: <FastRewind />,
              },
            ], "info")}
            {renderControlButtonGroup([
              {
                command: TurtleCommands.UP,
                title: "Up",
                icon: <ArrowUpward />,
              },
              {
                command: TurtleCommands.RIGHT,
                title: "Turn Right",
                icon: <TurnRight />,
              },
              null,
            ], "info")}
            {renderControlButtonGroup([
              null,null,null,
            ], "info")}
            {renderControlButtonGroup([
              {
                command: TurtleCommands.INSPECT_UP,
                title: "Inspect Up",
                icon: <ArrowUpward />,
              },
              {
                command: TurtleCommands.INSPECT,
                title: "Inspect Forward",
                icon: <Visibility />,
              },
              {
                command: TurtleCommands.INSPECT_DOWN,
                title: "Inspect Down",
                icon: <ArrowDownward />,
              },
            ], "success", "80px")}
            {renderControlButtonGroup([
              {
                command: TurtleCommands.PLACE_UP,
                title: "Place Up",
                icon: <ArrowUpward />,
              },
              {
                command: TurtleCommands.PLACE,
                title: "Place Forward",
                icon: <PanTool />,
              },
              {
                command: TurtleCommands.PLACE_DOWN,
                title: "Place Down",
                icon: <ArrowUpward />,
              },
            ], "primary", "80px")}
            {renderControlButtonGroup([
              {
                command: TurtleCommands.DIG_UP,
                title: "Dig Up",
                icon: <ArrowUpward />,
              },
              {
                command: TurtleCommands.DIG,
                title: "Dig Forward",
                icon: <Hardware />,
              },
              {
                command: TurtleCommands.DIG_DOWN,
                title: "Dig Down",
                icon: <ArrowDownward />,
              },
            ], "error", "80px")}
            {renderControlButtonGroup([
              {
                command: TurtleCommands.DROP_UP,
                title: "Drop Up",
                icon: <ArrowUpward />,
              },
              {
                command: TurtleCommands.DROP,
                title: "Drop Forward",
                icon: <Delete />,
              },
              {
                command: TurtleCommands.DROP_DOWN,
                title: "Drop Down",
                icon: <ArrowDownward />,
              },
            ], "secondary", "80px")}
            {renderControlButtonGroup([
              {
                command: TurtleCommands.SUCK_UP,
                title: "Suck Up",
                icon: <ArrowUpward />,
              },
              {
                command: TurtleCommands.SUCK,
                title: "Suck Forward",
                icon: <Add />,
              },
              {
                command: TurtleCommands.SUCK_DOWN,
                title: "Suck Down",
                icon: <ArrowDownward />,
              },
            ], "warning", "80px")}
          </Box>
        </Box>

        {/* Inventory */}
        <Box component="div"
          className="interactive"
          display="flex"
          flexDirection="column"
          gap={1}
          minWidth="300px"
          height="100%"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            border: '0.05rem solid #ccc',
            borderRadius: '4px',
          }}
        >

        </Box>

        <Box component="div"
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100%',
            height: 'auto',
            margin: '0',
            padding: '0',
          }}
        >
          <NotificationStack
          notifications={notifications}
          removeNotification={removeNotification}
        />
        </Box>


      </Box>
    </Box>
  );
};

export default TurtleHUD;
