import React, { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import '../styles/NotificationStack.css';


export interface Notification {
  id: number;
  message: string;
}

const NotificationStack: React.FC<{ notifications: Notification[], removeNotification: (id: number) => void }> = ({ notifications, removeNotification }) => {
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    notifications.forEach(notification => {
      if (!timers.current.has(notification.id)) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
          timers.current.delete(notification.id);
        }, 4000);
        timers.current.set(notification.id, timer);
      }
    });

    return () => {
      timers.current.forEach(timer => clearTimeout(timer));
      timers.current.clear();
    };
  }, [notifications, removeNotification]);

  return (
    <Box component="div" display="flex" width="100%" height="100%" flexDirection="column" alignItems="flex-end" justifyContent="flex-start" gap={1} p={1}>
      <TransitionGroup>
        {notifications.map((notification) => (
          <CSSTransition
            key={notification.id}
            timeout={300}
            classNames="fade"
          >
            <Box component="div"
              key={notification.id}
              bgcolor="#ff6666"
              boxShadow={1}
              p={1}
              mb={1}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              borderRadius={1}
              width="auto"
              minWidth={0}
              gap={1}
            >
              <Typography variant="body2" sx={{minWidth:"0", marginLeft:"0.8rem"}}>{notification.message}</Typography>
              <IconButton size="small" color="inherit" onClick={() => {
                clearTimeout(timers.current.get(notification.id));
                removeNotification(notification.id);
                timers.current.delete(notification.id);
              }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </CSSTransition>
        ))}
      </TransitionGroup>
    </Box>
  );
};

export default NotificationStack;
