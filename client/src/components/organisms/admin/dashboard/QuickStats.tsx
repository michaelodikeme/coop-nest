import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  useTheme,
  alpha,
  LinearProgress,
} from '@mui/material';

interface QuickStatItem {
  label: string;
  value: number | string;
  target?: number;
  color?: string;
  suffix?: string;
}

interface QuickStatsProps {
  title?: string;
  stats: QuickStatItem[];
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  title = "Quick Statistics",
  stats
}) => {
  const theme = useTheme();

  const calculateProgress = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100);
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: 1, 
        borderColor: 'divider', 
        borderRadius: 3,
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        
        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 6 }} key={index}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {stat.value}{stat.suffix}
                  </Typography>
                </Box>
                
                {stat.target && typeof stat.value === 'number' && (
                  <Box>
                    <LinearProgress
                      variant="determinate"
                      value={calculateProgress(stat.value, stat.target)}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: alpha(stat.color || theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: stat.color || theme.palette.primary.main,
                          borderRadius: 3,
                        },
                      }}
                    />
                    <Box display="flex" justifyContent="space-between" mt={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {calculateProgress(stat.value, stat.target).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};