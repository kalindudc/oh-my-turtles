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
        height: '100%',
        padding: '10px',
        overflowY: 'scroll',
        border: '0.05rem solid #ccc',
        borderRadius: '4px',
        fontFamily: 'monospace',
        backdropFilter: 'blur(10px)',
        margin: '0.5rem',
        flexDirection: 'column-reverse',
        display: 'flex',
      }}
    >
      {messages.map((message, index) => (
        <Typography key={index} variant="body2">
          {message}
        </Typography>
      ))}
    </Box>
  );
};

export default ScreenLine;
