import React from 'react';
import { Box, Skeleton } from '@mui/material';

const SkeletonMainContent: React.FC = () => {
  return (
    <Box sx={{ width: '80%', p: 3, textAlign: 'center' }}>
      <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={118} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={118} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" width="100%" height={118} sx={{ mb: 2 }} />
    </Box>
  );
};

export default SkeletonMainContent;
