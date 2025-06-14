'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, TooltipProps } from 'recharts';
import { format, subMonths } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Box, Typography, CircularProgress, Skeleton } from '@mui/material';
import { formatCurrency } from '@/utils/formatting/format';
import { transactionService } from '@/lib/api/services/transactionService';

interface TransactionChartProps {
  height?: number | string;
}

/**
 * A responsive chart component showing transaction activity across all modules
 */
export default function TransactionsSummaryChart({ height = 350 }: TransactionChartProps) {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('6M'); // Default to 6 months
  
  // Calculate date range
  const endDate = new Date();
  const startDate = subMonths(endDate, 6); // 6 months back
  
  // Fetch transaction statistics by month
  const { data: transactionStats, isLoading } = useQuery({
    queryKey: ['transactions-chart-data', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    queryFn: () => transactionService.generateReport(
      undefined, // All modules
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd'),
      'month' // Group by month
    )
  });

  // Process data for the chart
// Interfaces for typing
interface ModuleBreakdown {
    amount: number;
    count: number;
}

interface TransactionStatItem {
    year: number;
    month: number;
    moduleBreakdown?: {
        SAVINGS?: ModuleBreakdown;
        LOAN?: ModuleBreakdown;
        SHARES?: ModuleBreakdown;
    };
}

interface ChartDataItem {
    name: string;
    savings: number;
    loans: number;
    shares: number;
}

const chartData: ChartDataItem[] = transactionStats?.map((item: TransactionStatItem) => ({
    name: format(new Date(item.year, item.month - 1), 'MMM yy'),
    savings: item.moduleBreakdown?.SAVINGS?.amount || 0,
    loans: item.moduleBreakdown?.LOAN?.amount || 0,
    shares: item.moduleBreakdown?.SHARES?.amount || 0,
})) || [];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[2],
          borderRadius: 1
        }}>
          <Typography variant="subtitle2">{label}</Typography>
          {payload.map(entry => (
            <Box key={entry.dataKey?.toString()} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Box 
                sx={{ 
                  width: 10, 
                  height: 10, 
                  backgroundColor: entry.color, 
                  borderRadius: '50%', 
                  mr: 1 
                }} 
              />
              <Typography variant="body2" sx={{ mr: 1 }}>
                {entry.dataKey ? (entry.dataKey.toString().charAt(0).toUpperCase() + entry.dataKey.toString().slice(1)) : ''}:
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {formatCurrency(entry.value as number)}
              </Typography>
            </Box>
          ))}
        </Box>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!chartData.length) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Typography variant="body1" color="text.secondary">No transaction data available</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="name" 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
        />
        <YAxis 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="savings" 
          name="Savings" 
          fill={theme.palette.primary.main} 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="loans" 
          name="Loans" 
          fill={theme.palette.error.main} 
          radius={[4, 4, 0, 0]}
        />
        <Bar 
          dataKey="shares" 
          name="Shares" 
          fill={theme.palette.success.main} 
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}