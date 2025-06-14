import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface TransactionSummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: {
    value: number;
    label: string;
  };
  loading: boolean;
  color?: string;
}

export default function TransactionSummaryCard({
  title,
  value,
  icon,
  trend,
  loading,
  color,
}: TransactionSummaryCardProps) {
  const theme = useTheme();
  
  return (
    <Card sx={{ 
      borderRadius: 2,
      boxShadow: 'none',
      height: '100%',
      border: `1px solid ${theme.palette.divider}`,
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: theme.shadows[4],
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              mr: 2,
              width: 48,
              height: 48,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color || theme.palette.primary.main,
              bgcolor: color ? `${color}15` : theme.palette.primary.light + '20',
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
        </Box>
        
        {loading ? (
          <Skeleton variant="rectangular" width="60%" height={36} />
        ) : (
          <Typography variant="h4" component="div" fontWeight={600} sx={{ mb: 1, color: 'text.primary' }}>
            {value}
          </Typography>
        )}
        
        {trend.label && !loading && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {trend.value > 0 ? (
              <TrendingUpIcon fontSize="small" color="success" sx={{ mr: 1 }} />
            ) : (
              <TrendingDownIcon fontSize="small" color="error" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2" color={trend.value > 0 ? 'success.main' : 'error.main'}>
              {trend.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}