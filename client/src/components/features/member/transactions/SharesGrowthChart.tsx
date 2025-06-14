import { useMemo } from 'react';
import { Box, Typography, CircularProgress, Divider, useTheme } from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  TooltipProps 
} from 'recharts';
import { formatCurrency } from '@/utils/formatting/format';
import { TransactionRecord } from '@/lib/api';

interface SharesGrowthChartProps {
  transactions: TransactionRecord[];
  isLoading: boolean;
  initialBalance?: number;
}

export default function SharesGrowthChart({ 
  transactions, 
  isLoading,
  initialBalance = 0 
}: SharesGrowthChartProps) {
  const theme = useTheme();
  
  // Process data for chart
  const chartData = useMemo(() => {
    if (!transactions.length) return [];
    
    // Sort transactions by date
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Calculate running balance
    let balance = initialBalance;
    const data = sortedTransactions.map(tx => {
      const amount = Number(tx.amount);
      if (tx.transactionType === 'SHARE_PURCHASE') {
        balance += amount;
      } else if (tx.transactionType === 'SHARE_REDEMPTION') {
        balance -= amount;
      }
      
      return {
        date: new Date(tx.createdAt).toLocaleDateString(),
        value: balance,
        transaction: tx.transactionType === 'SHARE_PURCHASE' ? amount : -amount
      };
    });
    
    return data;
  }, [transactions, initialBalance]);

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
              Value:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(payload[0]?.value as number)}
            </Typography>
          </Box>
          
          {payload[1] && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Transaction:
                </Typography>
                <Typography 
                  variant="body2" 
                  fontWeight={500}
                  color={(payload[1]?.value as number) >= 0 ? 'success.main' : 'error.main'}
                >
                  {(payload[1]?.value as number) >= 0 ? '+' : ''}
                  {formatCurrency(payload[1]?.value as number)}
                </Typography>
              </Box>
            </>
          )}
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
          No shares data available for this period
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
      >
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          tickMargin={10}
        />
        <YAxis 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}k` : value}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: 15 }}
          formatter={(value) => <span style={{ color: theme.palette.text.primary }}>{value}</span>}
        />
        <Area 
          type="monotone" 
          dataKey="value" 
          name="Share Value" 
          stroke={theme.palette.success.main}
          fillOpacity={1}
          fill="url(#colorValue)"
          strokeWidth={2}
          activeDot={{ r: 6 }}
        />
        <Area
          type="monotone"
          dataKey="transaction"
          name="Transaction"
          stroke="none"
          fill="none"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}