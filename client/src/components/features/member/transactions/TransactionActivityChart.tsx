import { useMemo } from 'react';
import { Box, Typography, CircularProgress, useTheme, Divider } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  TooltipProps 
} from 'recharts';
import { formatCurrency } from '@/utils/formatting/format';

interface ActivityData {
  date: string;
  credit: number;
  debit: number;
}

interface TransactionActivityChartProps {
  data: ActivityData[];
  isLoading: boolean;
}

export default function TransactionActivityChart({ data, isLoading }: TransactionActivityChartProps) {
  const theme = useTheme();
  
  // Sort data by date
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
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
          
          {payload.map((entry, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box 
                component="span" 
                sx={{ 
                  width: 12, 
                  height: 12, 
                  mr: 1, 
                  borderRadius: '50%',
                  bgcolor: entry.color 
                }} 
              />
              <Typography variant="body2" sx={{ mr: 1 }}>
                {entry.name}:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatCurrency(entry.value as number)}
              </Typography>
            </Box>
          ))}
          
          <Divider sx={{ my: 1 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">Net:</Typography>
            <Typography 
              variant="body2" 
              fontWeight={500}
              color={
                (payload[0]?.value as number) - (payload[1]?.value as number) >= 0 
                ? 'success.main' 
                : 'error.main'
              }
            >
              {formatCurrency((payload[0]?.value as number) - (payload[1]?.value as number))}
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

  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="body1" color="text.secondary">
          No transaction data available for this period
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={sortedData}
        margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
      >
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
        <Bar 
          dataKey="credit" 
          name="Income" 
          fill={theme.palette.success.main} 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="debit" 
          name="Expense" 
          fill={theme.palette.error.main}
          radius={[4, 4, 0, 0]} 
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Note: This is an example of how to prepare data for the TransactionActivityChart component
// This code should be used wherever you're preparing data to pass to this component
/*
export function prepareTransactionActivityData(transactionsData: any): ActivityData[] {
  if (!transactionsData?.data) return [];
  
  // Group transactions by date
  const byDate = transactionsData.data.reduce((acc, transaction) => {
    // Format to YYYY-MM-DD
    const date = transaction.createdAt.split('T')[0];
    
    if (!acc[date]) {
      acc[date] = {
        date,
        credit: 0,
        debit: 0
      };
    }
    
    if (transaction.baseType === 'CREDIT') {
      acc[date].credit += Number(transaction.amount);
    } else {
      acc[date].debit += Number(transaction.amount);
    }
    
    return acc;
  }, {});
  
  // Convert to array and sort by date
  return Object.values(byDate).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}
*/