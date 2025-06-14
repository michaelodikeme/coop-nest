import React from 'react';
import { Grid, Box } from '@mui/material';

interface DashboardGridProps {
  children: React.ReactNode;
  spacing?: number;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({ 
  children, 
  spacing = 3 
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Grid container spacing={spacing}>
        {children}
      </Grid>
    </Box>
  );
};

interface DashboardSectionProps {
  children: React.ReactNode;
  size?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ 
  children, 
  size = { xs: 12 } 
}) => {
  return (
    <Grid size={size}>
      {children}
    </Grid>
  );
};