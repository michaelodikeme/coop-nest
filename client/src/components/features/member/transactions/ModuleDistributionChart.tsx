import { useMemo } from 'react';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  Tooltip, 
  ResponsiveContainer, 
  TooltipProps 
} from 'recharts';
import { formatCurrency } from '@/utils/formatting/format';
import { TransactionRecord } from '@/lib/api';

interface ModuleDistributionChartProps {
  data: TransactionRecord[];
  isLoading: boolean;
}

export default function ModuleDistributionChart({ data, isLoading }: ModuleDistributionChartProps) {
  const theme = useTheme();
  
  // Process data by module
  const chartData = useMemo(() => {
    if (!data.length) return [];
    
    const moduleGroups = data.reduce((acc, transaction) => {
      const module = transaction.module || 'UNKNOWN';
      
      if (!acc[module]) {
        acc[module] = {
          name: moduleDisplayName(module),
          value: 0,
          count: 0,
        };
      }
      
      acc[module].value += Number(transaction.amount);
      acc[module].count += 1;
      
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number }>);
    
    return Object.values(moduleGroups);
  }, [data]);
  
  // Module display names
  const moduleDisplayName = (module: string) => {
    switch (module) {
      case 'SAVINGS': return 'Savings';
      case 'LOAN': return 'Loans';
      case 'SHARES': return 'Shares';
      case 'ADMIN': return 'Admin';
      default: return 'Other';
    }
  };
  
  // Chart colors
  const COLORS = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main,
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{
          bgcolor: 'background.paper',
          p: 1.5,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          boxShadow: theme.shadows[3]
        }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>{data.name}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{ mr: 3 }}>Amount:</Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatCurrency(data.value)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ mr: 3 }}>Transactions:</Typography>
            <Typography variant="body2" fontWeight={500}>
              {data.count}
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
          No transaction data available for this period
        </Typography>
      </Box>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={2}
          dataKey="value"
          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          formatter={(value, entry) => (
            <span style={{ color: theme.palette.text.primary }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}