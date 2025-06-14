import { useState } from 'react';
import { Box, Card, CardContent, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/formatting/format';
import { BalanceHistory } from '@/types/personal-savings.types';

interface BalanceChartProps {
  data: BalanceHistory;
}

export function BalanceChart({ data }: BalanceChartProps) {
  const [timeRange, setTimeRange] = useState<'daily' | 'monthly'>('monthly');
  
  // Check if we have data to display - improved check
  const hasData = data && (
    (timeRange === 'daily' && data.daily?.length > 0) || 
    (timeRange === 'monthly' && data.monthly?.length > 0)
  );
  
  if (!hasData) {
    return (
      <Card sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          Not enough data to display chart
        </Typography>
      </Card>
    );
  }
  
  // Format the data for the chart
  const chartData = timeRange === 'daily' ? data.daily : data.monthly;
  
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card sx={{ p: 2, boxShadow: 2 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            {label}
          </Typography>
          <Typography variant="body2" color="success.main">
            Balance: {formatCurrency(payload[0].value)}
          </Typography>
        </Card>
      );
    }
    
    return null;
  };
  
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Balance History</Typography>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(_, newValue) => newValue && setTimeRange(newValue)}
            size="small"
          >
            <ToggleButton value="daily">Daily</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Box sx={{ height: 350, width: '100%' }}>
          <ResponsiveContainer>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={timeRange === 'daily' ? 'date' : 'month'} 
                tickFormatter={(value) => {
                  if (timeRange === 'daily') {
                    // Format date as DD/MM
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }
                  return value; // Return month name as is
                }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}