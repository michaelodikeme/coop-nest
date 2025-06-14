import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
} from '@mui/material';
import { formatCurrency } from '@/utils/formatting/format';

// Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    period?: string;
  };
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  description?: string;
  onClick?: () => void;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  description,
  onClick,
  loading = false
}) => {
  const theme = useTheme();
  
  const colorMap = {
    primary: theme.palette.primary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    info: theme.palette.info.main,
  };

  const mainColor = colorMap[color];

  const getTrendColor = () => {
    if (trend?.direction === 'up') return theme.palette.success.main;
    if (trend?.direction === 'down') return theme.palette.error.main;
    return theme.palette.text.secondary;
  };

  const getTrendIcon = () => {
    if (trend?.direction === 'up') return <TrendingUpIcon fontSize="small" />;
    if (trend?.direction === 'down') return <TrendingDownIcon fontSize="small" />;
    return null;
  };

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: `1px solid ${alpha(mainColor, 0.12)}`,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(mainColor, 0.02)} 0%, ${alpha(mainColor, 0.05)} 100%)`,
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${alpha(mainColor, 0.15)}`,
          borderColor: alpha(mainColor, 0.3),
        } : {},
      }}
      onClick={onClick}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 120,
          height: 120,
          background: `radial-gradient(circle, ${alpha(mainColor, 0.08)} 0%, transparent 70%)`,
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      
      <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
        {/* Header with Icon and Info */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Avatar
            sx={{
              bgcolor: alpha(mainColor, 0.1),
              color: mainColor,
              width: 48,
              height: 48,
              '& .MuiSvgIcon-root': {
                fontSize: '1.5rem',
              },
            }}
          >
            {icon}
          </Avatar>
          
          {description && (
            <Tooltip title={description} arrow placement="top">
              <IconButton size="small" sx={{ opacity: 0.6 }}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Title */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          fontWeight={600}
          sx={{ 
            mb: 1,
            fontSize: '0.875rem',
            letterSpacing: '0.025em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Typography>

        {/* Value */}
        <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            mb: 2,
            fontWeight: 700,
            color: 'text.primary',
            fontSize: { xs: '1.75rem', sm: '2rem' },
            lineHeight: 1.2,
          }}
        >
          {typeof value === 'number' && value >= 1000 
            ? formatCurrency(value) 
            : value}
        </Typography>

        {/* Trend Indicator */}
        {trend && (
          <Box display="flex" alignItems="center">
            <Box
              display="flex"
              alignItems="center"
              sx={{
                color: getTrendColor(),
                backgroundColor: alpha(getTrendColor(), 0.1),
                borderRadius: 1,
                px: 1,
                py: 0.5,
              }}
            >
              {getTrendIcon()}
              <Typography 
                variant="body2" 
                fontWeight={600} 
                sx={{ ml: 0.5 }}
              >
                {trend.percentage}%
              </Typography>
            </Box>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ ml: 1 }}
            >
              {trend.period || 'vs last month'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};