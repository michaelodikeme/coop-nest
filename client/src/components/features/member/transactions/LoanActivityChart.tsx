'use client';

import { useState } from 'react';
import { useTheme } from '@mui/material';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  TooltipProps
} from 'recharts';
import { Box, Typography, CircularProgress } from '@mui/material';
import { formatCurrency } from '@/utils/formatting/format';

interface LoanActivityChartProps {
  data?: any[];
  isLoading?: boolean;
}

/**
 * A chart component showing loan disbursements and repayments
 */
export default function LoanActivityChart({ data = [], isLoading = false }: LoanActivityChartProps) {
  const theme = useTheme();
  
  // Process data for the chart
  const chartData = data?.map(item => {
    const disbursementAmount = item.typeBreakdown?.LOAN_DISBURSEMENT?.amount || 0;
    const repaymentAmount = item.typeBreakdown?.LOAN_REPAYMENT?.amount || 0;
    
    return {
      name: `${item.month}/${item.year.toString().substr(2)}`,
      disbursements: disbursementAmount,
      repayments: repaymentAmount,
      // Calculate net as disbursements - repayments
      net: disbursementAmount - repaymentAmount,
    };
  }) || [];

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
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 0.5 }}>
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                backgroundColor: theme.palette.error.main, 
                borderRadius: '50%', 
                mr: 1 
              }} 
            />
            <Typography variant="body2" sx={{ mr: 1 }}>Disbursements:</Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(payload[0]?.value as number || 0)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                backgroundColor: theme.palette.primary.main, 
                borderRadius: '50%', 
                mr: 1 
              }} 
            />
            <Typography variant="body2" sx={{ mr: 1 }}>Repayments:</Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(payload[1]?.value as number || 0)}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                width: 10, 
                height: 10, 
                backgroundColor: theme.palette.secondary.main, 
                borderRadius: '50%', 
                mr: 1 
              }} 
            />
            <Typography variant="body2" sx={{ mr: 1 }}>Net Balance:</Typography>
            <Typography 
              variant="body2" 
              fontWeight={500} 
              color={(payload[2]?.value as number) > 0 ? theme.palette.error.main : theme.palette.success.main}
            >
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
      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!chartData.length) {
    return (
      <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Typography variant="body1" color="text.secondary">No loan activity data available</Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
        <XAxis 
          dataKey="name" 
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
        />
        <YAxis 
          yAxisId="left"
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
          tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          yAxisId="left"
          dataKey="disbursements" 
          name="Disbursements" 
          fill={theme.palette.error.main}
          radius={[4, 4, 0, 0]}
          barSize={20}
        />
        <Bar 
          yAxisId="left"
          dataKey="repayments" 
          name="Repayments" 
          fill={theme.palette.primary.main}
          radius={[4, 4, 0, 0]}
          barSize={20}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="net"
          name="Net Balance"
          stroke={theme.palette.secondary.main}
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}