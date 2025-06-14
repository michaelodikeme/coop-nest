import { useMemo } from 'react';
import { Box, Paper, Typography, Skeleton, useTheme } from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  ReferenceLine
} from 'recharts';
import { format, subMonths, parseISO } from 'date-fns';
import { TransactionRecord } from '@/lib/api';
import { NoDataMessage } from '@/components/molecules/NoDataMessage';
import { formatCurrency } from '@/utils/formatting/format';

interface ChartProps {
  data: TransactionRecord[];
  isLoading: boolean;
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
}

export function SavingsTransactionChart({ data, isLoading, dateRange }: ChartProps) {
  const theme = useTheme();

  // Safely parse date
  const safeDate = (dateString: string) => {
    try {
      // Try different formats: ISO string or regular date
      if (dateString.includes('T')) {
        return parseISO(dateString);
      }
      return new Date(dateString);
    } catch (e) {
      console.error("Invalid date format:", dateString);
      return new Date();
    }
  };

  const chartData = useMemo(() => {
    if (!data.length) return [];
    
    // Group transactions by month
    const groupedByMonth = data.reduce((acc, transaction) => {
      const month = format(safeDate(transaction.date || transaction.createdAt), 'yyyy-MM');
      
      if (!acc[month]) {
        acc[month] = {
          month,
          deposits: 0,
          withdrawals: 0,
          interest: 0
        };
      }
      
      // Determine transaction type
      const type = transaction.type || transaction.transactionType;
      
      if (type === 'DEPOSIT') {
        acc[month].deposits += Number(transaction.amount);
      } else if (type === 'WITHDRAWAL') {
        acc[month].withdrawals += Number(transaction.amount);
      } else if (type === 'INTEREST') {
        acc[month].interest += Number(transaction.amount);
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert to array and sort by date
    return Object.values(groupedByMonth).sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);
  
  // Calculate running balance data
  const balanceChartData = useMemo(() => {
    if (!data.length) return [];
    
    // Sort transactions by date
    const sortedTransactions = [...data].sort((a, b) => 
      safeDate(a.date || a.createdAt).getTime() - safeDate(b.date || b.createdAt).getTime()
    );
    
    let balance = 0;
    const runningBalance = sortedTransactions.map(transaction => {
      // Determine transaction type
      const type = transaction.type || transaction.transactionType;
      
      if (type === 'DEPOSIT' || type === 'INTEREST') {
        balance += Number(transaction.amount);
      } else if (type === 'WITHDRAWAL') {
        balance -= Number(transaction.amount);
      }
      
      return {
        date: format(safeDate(transaction.date || transaction.createdAt), 'MMM dd'),
        balance,
        type
      };
    });
    
    return runningBalance;
  }, [data]);
  
  // Generate last 6 months if no date range is selected
  const generateEmptyMonths = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(today, i);
      months.push({
        month: format(month, 'yyyy-MM'),
        deposits: 0,
        withdrawals: 0,
        interest: 0
      });
    }
    
    return months;
  };
  
  const displayData = chartData.length ? chartData : generateEmptyMonths();
  
  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <Skeleton variant="rectangular" height={400} animation="wave" />
      </Box>
    );
  }

  if (!data.length) {
    return (
      <Box 
        component={Paper} 
        elevation={0} 
        sx={{ 
          width: '100%', 
          p: 4, 
          mt: 2, 
          display: 'flex', 
          justifyContent: 'center',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <NoDataMessage
          title="No Transaction Data"
          message="There are no transactions available for the selected period."
        />
      </Box>
    );
  }

  // Calculate max value for better y-axis scaling
  const maxDeposit = Math.max(...displayData.map(item => item.deposits));
  const maxWithdrawal = Math.max(...displayData.map(item => item.withdrawals));
  const maxInterest = Math.max(...displayData.map(item => item.interest));
  const yAxisMax = Math.max(maxDeposit, maxWithdrawal, maxInterest) * 1.1; // 10% padding

  // Calculate max balance for line chart
  const maxBalance = Math.max(...balanceChartData.map(item => item.balance));
  const minBalance = Math.min(...balanceChartData.map(item => item.balance));
  const balanceRange = Math.max(Math.abs(maxBalance), Math.abs(minBalance));

  return (
    <Box 
      component={Paper} 
      elevation={0} 
      sx={{ 
        width: '100%', 
        p: 3, 
        mt: 2,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2
      }}
    >
      <Typography variant="h6" gutterBottom>Savings Activity by Month</Typography>
      <Box sx={{ height: 400, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickFormatter={(tickItem) => {
                try {
                  return format(new Date(tickItem), 'MMM yyyy');
                } catch (e) {
                  return tickItem;
                }
              }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value).replace('₦', '')} 
              tick={{ fontSize: 12 }}
              domain={[0, yAxisMax]}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(label) => {
                try {
                  return format(new Date(label), 'MMMM yyyy');
                } catch (e) {
                  return label;
                }
              }}
            />
            <Legend />
            <Bar 
              dataKey="deposits" 
              name="Deposits" 
              fill={theme.palette.success.main}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="withdrawals" 
              name="Withdrawals" 
              fill={theme.palette.error.main}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="interest" 
              name="Interest" 
              fill={theme.palette.info.main}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Savings Balance Trend</Typography>
      <Box sx={{ height: 300, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={balanceChartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value).replace('₦', '')} 
              tick={{ fontSize: 12 }}
              domain={[-balanceRange * 0.1, balanceRange * 1.1]} // Add padding for better visualization
            />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(label) => label}
            />
            <Legend />
            <ReferenceLine y={0} stroke={theme.palette.divider} />
            <Line 
              type="monotone" 
              dataKey="balance" 
              name="Balance" 
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              dot={{ 
                fill: theme.palette.background.paper, 
                strokeWidth: 2, 
                r: 4,
                strokeDasharray: '' 
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}