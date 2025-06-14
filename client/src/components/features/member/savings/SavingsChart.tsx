import React, { useState, useMemo } from 'react';
import { formatCurrency } from '@/utils/formatting/format';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ButtonGroup,
  Button,
  Skeleton,
  useTheme
} from '@mui/material';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import { savingsService } from '@/lib/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart type options
type ChartType = 'line' | 'bar';
type TimeRange = '3M' | '6M' | '1Y' | 'ALL';

// Updated interface to include year property
interface SavingsChartProps {
  height?: number;
  savingsData?: Array<{month: number; year?: number; amount: number}>;
  shareData?: Array<{month: number; year?: number; amount: number}>;
  showShares?: boolean;
  totalSavings?: number;
  totalShares?: number;
  isLoading?: boolean;
}

const SavingsChart: React.FC<SavingsChartProps> = ({ 
  height = 300,
  savingsData = [],
  shareData = [],
  showShares = false,
  totalSavings = 0,
  totalShares = 0,
  isLoading = false
}) => {
  const theme = useTheme();
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  
  // Define months at component level for access in all functions
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Fetch ALL historical data when needed
  const { data: allSavingsData, isLoading: allSavingsLoading } = useQuery({
    queryKey: ['savings-chart-all-history', timeRange === 'ALL'],
    queryFn: async () => {
      if (timeRange === 'ALL') {
        try {
          console.log("Fetching ALL historical savings data for SavingsChart");
          
          // First call to get initial page and total pages info
          const firstPageResult = await savingsService.getMySavings({ page: 1, limit: 50 });

          console.log('Savings chart record from firstPageResults', firstPageResult)
          
          // Extract total pages from meta
          const { totalPages } = firstPageResult.meta;
          let allRecords = [...firstPageResult.data];
          
          // If we have more than one page, fetch the remaining pages
          if (totalPages > 1) {
            const remainingPageNumbers = Array.from(
              { length: totalPages - 1 },
              (_, i) => i + 2
            );
            
            const remainingPagesPromises = remainingPageNumbers.map(pageNum => 
              savingsService.getMySavings({ page: pageNum, limit: 50 })
            );
            
            const remainingPagesResults = await Promise.all(remainingPagesPromises);
            
            remainingPagesResults.forEach(pageResult => {
              allRecords = [...allRecords, ...pageResult.data];
            });
          }
          
          console.log(`Fetched total of ${allRecords.length} savings records from ${totalPages} pages`);
          return { 
            data: allRecords,
            meta: { ...firstPageResult.meta, total: allRecords.length }
          };
        } catch (error) {
          console.error('Error fetching all historical savings data:', error);
          return null;
        }
      }
      return null;
    },
    staleTime: 600000, // 10 minutes
    enabled: timeRange === 'ALL'
  });
  
  // Process the all historical data - convert the API records to chart format
  const historicalSavingsData = useMemo(() => {
    if (timeRange !== 'ALL' || !allSavingsData?.data?.length) return [];
    
    // Process all historical data when in ALL mode
    const processedData = allSavingsData.data.map(record => ({
      month: record.month,
      year: record.year,
      amount: Number(record.balance || 0)
    }));
    
    // Sort by year and month for proper chronological display
    return processedData.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [allSavingsData, timeRange]);
  
  // Process all historical shares data
  const historicalSharesData = useMemo(() => {
    if (timeRange !== 'ALL' || !allSavingsData?.data?.length || !showShares) return [];
    
    const processedData = allSavingsData.data.map(record => ({
      month: record.month,
      year: record.year,
      amount: record.shares?.[0] ? Number(record.shares[0].totalAmount || 0) : 0
    }));
    
    return processedData.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });
  }, [allSavingsData, timeRange, showShares]);
  
  // First, get the filtered data based on time range
  const filteredSavingsData = useMemo(() => {
    // Use historical data if in ALL mode and data is available
    if (timeRange === 'ALL' && historicalSavingsData.length > 0) {
      return historicalSavingsData;
    }
    
    // Otherwise, use the provided savingsData with filtering
    let filteredData = [...savingsData];
    
    switch (timeRange) {
      case '3M':
      return filteredData.slice(-3);
      case '6M':
      return filteredData.slice(-6);
      case '1Y':
      return filteredData.slice(-12);
      default:
      return filteredData;
    }
  }, [savingsData, timeRange, historicalSavingsData]);
  
  // Same for shares data
  const filteredSharesData = useMemo(() => {
    if (!showShares) return [];
    
    // Use historical shares data if in ALL mode and data is available
    if (timeRange === 'ALL' && historicalSharesData.length > 0) {
      return historicalSharesData;
    }
    
    // Otherwise, use the provided shareData with filtering
    let filteredData = [...shareData];
    
    switch (timeRange) {
      case '3M':
      return filteredData.slice(-3);
      case '6M':
      return filteredData.slice(-6);
      case '1Y':
      return filteredData.slice(-12);
      default:
      return filteredData;
    }
  }, [shareData, timeRange, historicalSharesData, showShares]);
  
  // Format chart data with proper labels
  const chartData = useMemo(() => {
    if (filteredSavingsData.length === 0) return null;
    
    // Create labels differently for ALL view to include year
    const labels = timeRange === 'ALL' 
    ? filteredSavingsData.map(item => {
      const month = months[item.month - 1];
      const year = item.year ? `'${String(item.year).slice(-2)}` : '';
      return `${month}${year ? ' ' + year : ''}`;
    })
    : filteredSavingsData.map(item => months[item.month - 1]);
    
    const savingsValues = filteredSavingsData.map(item => item.amount);
    const sharesValues = showShares ? filteredSharesData.map(item => item.amount) : [];
    
    return {
      labels,
      datasets: [
        {
          label: 'Savings',
          data: savingsValues,
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.main + '40',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
        },
        ...(showShares ? [
          {
            label: 'Shares',
            data: sharesValues,
            borderColor: theme.palette.secondary.main,
            backgroundColor: theme.palette.secondary.main + '40',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
          }
        ] : []),
      ],
    };
  }, [filteredSavingsData, filteredSharesData, showShares, timeRange, theme, months]);
  
  // Enhanced chart options for ALL view
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          },
          title: function(tooltipItems: any) {
            if (timeRange === 'ALL' && tooltipItems.length > 0) {
              const index = tooltipItems[0].dataIndex;
              const item = filteredSavingsData[index];
              if (item && item.year) {
                const month = months[item.month - 1];
                return `${month} ${item.year}`;
              }
            }
            return tooltipItems[0].label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: timeRange === 'ALL' ? 45 : 0,
          minRotation: timeRange === 'ALL' ? 45 : 0,
          autoSkip: true,
          maxTicksLimit: timeRange === 'ALL' ? 
          Math.min(filteredSavingsData.length, 24) : 12,
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(tickValue: any) {
            if (typeof tickValue === 'number') {
              return '₦' + tickValue.toLocaleString();
            }
            return tickValue;
          }
        }
      },
    },
  }), [timeRange, filteredSavingsData, months]);
  
  // Calculate average and total stats for summary
  const savingsStats = useMemo(() => {
    if (!filteredSavingsData.length) return { average: 0, total: 0 };
    
    const total = filteredSavingsData.reduce((sum, item) => sum + item.amount, 0);
    const average = total / filteredSavingsData.length;
    
    return { average, total };
  }, [filteredSavingsData]);
  
  const sharesStats = useMemo(() => {
    if (!filteredSharesData.length) return { average: 0, total: 0 };
    
    const total = filteredSharesData.reduce((sum, item) => sum + item.amount, 0);
    const average = total / filteredSharesData.length;
    
    return { average, total };
  }, [filteredSharesData]);
  
  return (
    <Card sx={{ borderRadius: 2 }}>
    <CardContent>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
    <Typography variant="h6">Savings Growth</Typography>
    <Box sx={{ display: 'flex', gap: 2 }}>
    {/* Time range selector */}
    <ButtonGroup size="small" aria-label="time range">
    {(['3M', '6M', '1Y', 'ALL'] as TimeRange[]).map((range) => (
      <Button
      key={range}
      variant={timeRange === range ? 'contained' : 'outlined'}
      onClick={() => setTimeRange(range)}
      >
      {range}
      </Button>
    ))}
    </ButtonGroup>
    
    {/* Chart type selector */}
    <ButtonGroup size="small" aria-label="chart type">
    <Button
    variant={chartType === 'line' ? 'contained' : 'outlined'}
    onClick={() => setChartType('line')}
    >
    Line
    </Button>
    <Button
    variant={chartType === 'bar' ? 'contained' : 'outlined'}
    onClick={() => setChartType('bar')}
    >
    Bar
    </Button>
    </ButtonGroup>
    </Box>
    </Box>
    
    <Box sx={{ height }}>
    {(isLoading || (timeRange === 'ALL' && allSavingsLoading)) ? (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>
    ) : !chartData ? (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography color="text.secondary">No data available</Typography>
      </Box>
    ) : chartType === 'line' ? (
      <Line options={chartOptions} data={chartData} height={height} />
    ) : (
      <Bar options={chartOptions} data={chartData} height={height} />
    )}
    </Box>
    
    {/* Summary statistics */}
    {!isLoading && filteredSavingsData.length > 0 && (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
      <Box>
      <Typography variant="body2" color="text.secondary">Average Monthly</Typography>
      <Typography variant="h6">
      {formatCurrency(savingsStats.average)}
      </Typography>
      </Box>
      <Box>
      <Typography variant="body2" color="text.secondary">Total Savings</Typography>
      <Typography variant="h6">
      {formatCurrency(timeRange === 'ALL' ? totalSavings : savingsStats.total)}
      </Typography>
      </Box>
      {showShares && (
        <Box>
        <Typography variant="body2" color="text.secondary">Total Shares</Typography>
        <Typography variant="h6">
        {formatCurrency(timeRange === 'ALL' ? totalShares : sharesStats.total)}
        </Typography>
        </Box>
      )}
      </Box>
    )}
    </CardContent>
    </Card>
  );
};

export default SavingsChart;
