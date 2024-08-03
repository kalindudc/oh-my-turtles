// components/SendMessageButton.tsx
import React from 'react';
import { IconButton, ButtonProps } from '@mui/material';
import { useWebSocket } from '../context/WebSocketContext';

interface SendMessageIconButtonProps extends ButtonProps {
  payload: any;
}

const SendMessageIconButton: React.FC<SendMessageIconButtonProps> = ({ payload, ...props }) => {
  const { sendMessage } = useWebSocket();

  const handleClick = () => {
    sendMessage(JSON.stringify(payload));
  };

  return (
    <IconButton onClick={handleClick} {...props}>
      {props.children || 'Send Message'}
    </IconButton>
  );
};

export default SendMessageIconButton;
