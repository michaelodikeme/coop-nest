import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  alpha,
  Skeleton,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Chip,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useMonthlyFinancialData } from '@/lib/hooks/admin/useMonthlyFinancialData';

// Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import WarningIcon from '@mui/icons-material/Warning';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface MonthlyData {
  month: string;
  savings: number;
  loans: number;
  transactions: number;
  shares: number;
  deposits: number;
  withdrawals: number;
}

interface MonthlyFinancialChartProps {
  height?: number;
  showControls?: boolean;
}

const MonthlyFinancialChart: React.FC<MonthlyFinancialChartProps> = ({ 
  height = 400, 
  showControls = true 
}) => {
  const theme = useTheme();
  const [selectedYear, setSelectedYear] = React.useState<number>(new Date().getFullYear());
  const [chartType, setChartType] = React.useState<'line' | 'bar'>('line');

  // Use the new comprehensive hook
  const { 
    data: financialData, 
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats
  } = useMonthlyFinancialData(selectedYear);

  // Get available years for selection
  const availableYears = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  // Calculate trend using the two most recent months that have actual data
  const calculateTrend = (data: any[], key: keyof MonthlyData) => {
    if (!data || data.length < 2) return { trend: 'neutral', change: 0 };

    // Only consider months with a non-zero value for this series
    const activeMonths = data.filter(item => Number(item[key]) > 0);
    if (activeMonths.length < 2) return { trend: 'neutral', change: 0 };

    const current = Number(activeMonths[activeMonths.length - 1][key]) || 0;
    const previous = Number(activeMonths[activeMonths.length - 2][key]) || 0;

    if (previous === 0) return { trend: 'neutral', change: 0 };

    const change = ((current - previous) / previous) * 100;
    const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'neutral';

    return { trend, change: Math.abs(change) };
  };

  // Chart data configuration - update to use the new data structure
  const chartData = React.useMemo(() => {
    if (!financialData?.monthlyData) return { labels: [], datasets: [] };

    const labels = financialData.monthlyData.map(item => item.month);
    
    const datasets = [
      {
        label: 'Savings',
        data: financialData.monthlyData.map(item => item.savings),
        borderColor: theme.palette.success.main,
        backgroundColor: alpha(theme.palette.success.main, chartType === 'bar' ? 0.8 : 0.1),
        tension: 0.4,
        fill: chartType === 'line',
        pointBackgroundColor: theme.palette.success.main,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Loans',
        data: financialData.monthlyData.map(item => item.loans),
        borderColor: theme.palette.warning.main,
        backgroundColor: alpha(theme.palette.warning.main, chartType === 'bar' ? 0.8 : 0.1),
        tension: 0.4,
        fill: chartType === 'line',
        pointBackgroundColor: theme.palette.warning.main,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Shares',
        data: financialData.monthlyData.map(item => item.shares),
        borderColor: theme.palette.info.main,
        backgroundColor: alpha(theme.palette.info.main, chartType === 'bar' ? 0.8 : 0.1),
        tension: 0.4,
        fill: chartType === 'line',
        pointBackgroundColor: theme.palette.info.main,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ];

    return { labels, datasets };
  }, [financialData, theme, chartType]);

  // Trend calculations - update to use the new data structure
  const savingsTrend = financialData?.monthlyData ? calculateTrend(financialData.monthlyData, 'savings') : { trend: 'neutral', change: 0 };
  const loansTrend = financialData?.monthlyData ? calculateTrend(financialData.monthlyData, 'loans') : { trend: 'neutral', change: 0 };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUpIcon fontSize="small" color="success" />;
      case 'down': return <TrendingDownIcon fontSize="small" color="error" />;
      default: return <div style={{ width: 20, height: 20 }} />;
    }
  };

  const ChartComponent = chartType === 'line' ? Line : Bar;
  
  // Define chart options
  const chartOptions = React.useMemo<ChartOptions<'line' | 'bar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          borderDash: [2],
          color: theme.palette.divider,
        },
        beginAtZero: true,
      },
    },
  }), [theme]);

  if (isStatsLoading) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <CardContent>
          <Skeleton variant="text" width={200} height={32} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 1 }} />
        </CardContent>
      </Card>
    );
  }

  if (statsError) {
    return (
      <Card elevation={0} sx={{ border: 1, borderColor: 'error.main', borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <WarningIcon color="error" sx={{ mr: 1 }} />
            <Typography variant="h6" color="error">
              Error Loading Chart Data
            </Typography>
          </Box>
          <Typography color="text.secondary" mb={2}>
            Unable to load monthly financial data. Please try refreshing.
          </Typography>
          <IconButton onClick={() => refetchStats()} color="primary">
            <RefreshIcon />
          </IconButton>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      elevation={0} 
      sx={{ 
        border: 1, 
        borderColor: 'divider', 
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header with controls */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Monthly Financial Overview
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Financial trends for {selectedYear}
              </Typography>
              {savingsTrend.trend !== 'neutral' && (
                <Box display="flex" alignItems="center">
                  {getTrendIcon(savingsTrend.trend)}
                  <Typography variant="body2" color="text.secondary" ml={0.5}>
                    {savingsTrend.change.toFixed(1)}%
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {showControls && (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Chart type toggle */}
              <Tooltip title="Toggle chart type">
                <IconButton
                  onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')}
                  size="small"
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                  }}
                >
                  {chartType === 'line' ? <BarChartIcon /> : <TimelineIcon />}
                </IconButton>
              </Tooltip>

              {/* Year selector */}
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  variant="outlined"
                  sx={{ fontSize: '0.875rem' }}
                >
                  {availableYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Refresh button */}
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={() => refetchStats()}
                  size="small"
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Box>

        {/* Trend indicators */}
        <Stack direction="row" spacing={2} mb={3}>
          <Chip
            icon={getTrendIcon(savingsTrend.trend)}
            label={`Savings ${savingsTrend.change.toFixed(1)}%`}
            size="small"
            variant="outlined"
            sx={{
              borderColor: savingsTrend.trend === 'up' ? 'success.main' : 
                          savingsTrend.trend === 'down' ? 'error.main' : 'grey.300',
            }}
          />
          <Chip
            icon={getTrendIcon(loansTrend.trend)}
            label={`Loans ${loansTrend.change.toFixed(1)}%`}
            size="small"
            variant="outlined"
            sx={{
              borderColor: loansTrend.trend === 'up' ? 'warning.main' : 
                          loansTrend.trend === 'down' ? 'success.main' : 'grey.300',
            }}
          />
        </Stack>

        {/* Chart container */}
        <Box 
          sx={{ 
            height: height,
            position: 'relative',
            '& canvas': {
              borderRadius: 1,
            }
          }}
        >
          <ChartComponent data={chartData} options={chartOptions} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default MonthlyFinancialChart;