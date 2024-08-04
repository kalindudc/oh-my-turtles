import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

interface ScreenLineProps {
  messages: string[];
}

const ScreenLine: React.FC<ScreenLineProps> = ({ messages }) => {
  return (
    <Box
      sx={{
        width: '100%',
        minWidth: "0",
        height: '100%',
        padding: '10px',
        overflowY: 'scroll',
        border: '0.05rem solid #ccc',
        borderRadius: '4px',
        fontFamily: 'monospace',
        backdropFilter: 'blur(10px)',
        flexDirection: 'column-reverse',
        display: 'flex',
        gap: '0.5rem',
      }}
    >
      {messages.map((message, index) => (
        <Typography
          key={index}
          variant="body2"
          sx={{
            padding: '0.4rem',
            backgroundColor: 'rgba(100, 100, 100, 0.1)',
            borderRadius: '4px',
            overflowWrap: "break-word",
          }}
          maxWidth="100%"
        >
          {message}
        </Typography>
      ))}
    </Box>
  );
};

export default ScreenLine;
