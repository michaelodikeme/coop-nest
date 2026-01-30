import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  useTheme
} from '@mui/material';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { usePersonalSavingsTransactions } from '@/lib/hooks/member/usePersonalSavings'; // This hook needs to be created
import { formatCurrency } from '@/utils/formatting/format';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PersonalSavingsChartProps {
  planId: string;
}

const PersonalSavingsChart: React.FC<PersonalSavingsChartProps> = ({ planId }) => {
  const theme = useTheme();
  const { data: transactions, isLoading } = usePersonalSavingsTransactions(planId); // This hook needs to be created

  const chartData = React.useMemo(() => {
    if (!transactions?.data?.length) return null;

    const sortedTransactions = [...transactions.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const labels = sortedTransactions.map(tx => new Date(tx.createdAt).toLocaleDateString());
    const data = sortedTransactions.map(tx => tx.balanceAfter);

    return {
      labels,
      datasets: [
        {
          label: 'Balance',
          data,
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.main + '40',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [transactions, theme]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Balance: ${formatCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatCurrency(value),
        },
      },
    },
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Balance History</Typography>
        <Box sx={{ height: 300, mt: 3 }}>
          {isLoading ? (
            <Skeleton variant="rectangular" width="100%" height="100%" />
          ) : !chartData ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">No transaction data available.</Typography>
            </Box>
          ) : (
            <Line options={chartOptions} data={chartData} />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PersonalSavingsChart;
