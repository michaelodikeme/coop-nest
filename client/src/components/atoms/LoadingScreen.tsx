'use client';

import { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Return null during SSR
  if (!isMounted) {
    return null;
  }
  
  return (
    <Box
      component="div"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        bgcolor: 'background.paper',
        zIndex: (theme) => theme.zIndex.modal + 1,
      }}
    >
      <CircularProgress size={40} />
      <Typography component="div" variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}