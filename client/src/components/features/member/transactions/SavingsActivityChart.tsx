import { useMemo } from 'react';
import { Box, Typography, CircularProgress, Divider, useTheme } from '@mui/material';
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  TooltipProps 
} from 'recharts';
import { formatCurrency } from '@/utils/formatting/format';

interface SavingsTransaction {
  date: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
}

interface SavingsActivityChartProps {
  data: SavingsTransaction[];
  isLoading: boolean;
}

export default function SavingsActivityChart({ data, isLoading }: SavingsActivityChartProps) {
  const theme = useTheme();
  
  // Process data for chart
  const chartData = useMemo(() => {
    if (!data.length) return [];
    
    // Group by date
    const groupedByDate = data.reduce((acc, transaction) => {
      const { date, amount, type } = transaction;
      
      if (!acc[date]) {
        acc[date] = {
          date,
          deposits: 0,
          withdrawals: 0,
        };
      }
      
      if (type === 'deposit') {
        acc[date].deposits += amount;
      } else {
        acc[date].withdrawals += amount;
      }
      
      return acc;
    }, {} as Record<string, { date: string; deposits: number; withdrawals: number }>);
    
    // Convert to array and sort by date
    let result = Object.values(groupedByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate running balance
    let balance = 0;
    result = result.map(item => {
      balance += item.deposits - item.withdrawals;
      return {
        ...item,
        balance
      };
    });
    
    return result;
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          bgcolor: 'background.paper',
          p: 1.5,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          boxShadow: theme.shadows[3]
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>{label}</Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box 
              component="span" 
              sx={{ 
                width: 12, 
                height: 12, 
                mr: 1, 
                borderRadius: '50%',
                bgcolor: theme.palette.success.main
              }} 
            />
            <Typography variant="body2" sx={{ mr: 1 }}>
              Deposits:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(payload[0]?.value as number || 0)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box 
              component="span" 
              sx={{ 
                width: 12, 
                height: 12, 
                mr: 1, 
                borderRadius: '50%',
                bgcolor: theme.palette.error.main
              }} 
            />
            <Typography variant="body2" sx={{ mr: 1 }}>
              Withdrawals:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(payload[1]?.value as number || 0)}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Balance:</Typography>
            <Typography variant="body2" fontWeight={500} color="primary.main">
              {formatCurrency(payload[2]?.value as number || 0)}
            </Typography>
          </Box>
        </Box>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!chartData.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="body1" color="text.secondary">
          No savings activity data available for this period
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          tickMargin={10}
        />
        <YAxis 
          yAxisId="left"
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}k` : value}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}k` : value}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: 15 }}
          formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
        />
        <Bar 
          yAxisId="left"
          dataKey="deposits" 
          name="Deposits" 
          fill={theme.palette.success.main} 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          yAxisId="left"
          dataKey="withdrawals" 
          name="Withdrawals" 
          fill={theme.palette.error.main}
          radius={[4, 4, 0, 0]} 
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="balance"
          name="Balance"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}