// components/SendMessageButton.tsx
import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { useWebSocket } from '../context/WebSocketContext';

interface SendMessageButtonProps extends ButtonProps {
  payload: any;
}

const SendMessageButton: React.FC<SendMessageButtonProps> = ({ payload, ...props }) => {
  const { sendMessage } = useWebSocket();

  const handleClick = () => {
    sendMessage(JSON.stringify(payload));
  };

  return (
    <Button onClick={handleClick} {...props}>
      {props.children || 'Send Message'}
    </Button>
  );
};

export default SendMessageButton;
