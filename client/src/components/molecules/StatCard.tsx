import { FC, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
  SvgIconProps,
} from '@mui/material';
import SavingsIcon from '@mui/icons-material/Savings';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PieChartIcon from '@mui/icons-material/PieChart';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PercentIcon from '@mui/icons-material/Percent';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

type IconName = 
  | 'savings'
  | 'account_balance'
  | 'pie_chart'
  | 'calendar_today'
  | 'percent'
  | 'payments'
  | 'credit_card'
  | 'trending_up';

type ColorOption = 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string | React.ReactNode;
  icon: IconName;
  color?: ColorOption;
  trend?: number;
  onClick?: () => void;
}

const StatCard: FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
  onClick
}) => {
  const theme = useTheme();

  // Icon mapping
  const iconMap: Record<IconName, FC<SvgIconProps>> = {
    savings: SavingsIcon,
    account_balance: AccountBalanceIcon,
    pie_chart: PieChartIcon,
    calendar_today: CalendarTodayIcon,
    percent: PercentIcon,
    payments: PaymentsIcon,
    credit_card: CreditCardIcon,
    trending_up: TrendingUpIcon
  };

  const IconComponent = iconMap[icon] || SavingsIcon;

  // Get color from theme palette
  const getColor = (colorName: ColorOption) => theme.palette[colorName].main;
  const selectedColor = getColor(color);
  
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: '0 2px 14px 0 rgba(32, 40, 45, 0.08)',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': {
          transform: onClick ? 'translateY(-4px)' : 'none',
          boxShadow: onClick ? '0 4px 18px 0 rgba(32, 40, 45, 0.12)' : '0 2px 14px 0 rgba(32, 40, 45, 0.08)',
          cursor: onClick ? 'pointer' : 'default',
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ padding: 3, height: '100%' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            mb: 2
          }}
        >
          <Typography variant="subtitle1" color="text.secondary">
            {title}
          </Typography>
          <Box 
            sx={{ 
              backgroundColor: alpha(selectedColor, 0.12),
              color: selectedColor,
              borderRadius: '50%',
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <IconComponent fontSize="small" />
          </Box>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
          
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
          
          {trend !== undefined && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 1,
                color: trend >= 0 ? theme.palette.success.main : theme.palette.error.main
              }}
            >
              {trend >= 0 ? 
                <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} /> : 
                <TrendingUpIcon fontSize="small" sx={{ mr: 0.5, transform: 'rotate(180deg)' }} />
              }
              <Typography variant="caption">
                {Math.abs(trend)}% {trend >= 0 ? 'increase' : 'decrease'}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;