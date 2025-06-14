import React, { FC, useState, useMemo, useEffect } from 'react';
import { formatCurrency } from '@/utils/formatting/format';
import { 
  Box, 
  Button, 
  ButtonGroup, 
  Paper, 
  Tab, 
  Tabs, 
  Typography, 
  useTheme,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { DateRange, TrendingUp } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { savingsService } from '@/lib/api';
import { Line, Bar } from 'react-chartjs-2';
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
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const timeRanges = ['3M', '6M', '1Y', 'ALL'];
const chartTypes = ['line', 'bar'] as const;
type ChartType = typeof chartTypes[number];

const TabPanel = ({ children, value, index, ...props }: { 
  children: React.ReactNode; 
  value: number; 
  index: number;
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`financial-insights-tabpanel-${index}`}
      aria-labelledby={`financial-insights-tab-${index}`}
      {...props}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

interface FinancialInsightsProps {
  monthlyTrend?: Array<{
    year: string; 
    month: number;
    savings: number;
    shares: number;
  }>;
  loanData?: Array<any>;
}

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FinancialInsights: FC<FinancialInsightsProps> = ({ 
  monthlyTrend = [],
  loanData = []
}) => {
  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  const [timeRange, setTimeRange] = useState('1Y');
  const [chartType, setChartType] = useState<ChartType>('line');
  
  const currentYear = new Date().getFullYear();
  
  // Add MORE detailed console logs to debug
  console.log('Props monthly trend data:', monthlyTrend);
  console.log('Monthly trend type:', typeof monthlyTrend);
  console.log('Monthly trend length:', monthlyTrend?.length);
  
  // Direct API call as fallback if props are empty
  const { data: savingsStats, isLoading: savingsLoading } = useQuery({
    queryKey: ['financial-insights-savings', currentYear],
    queryFn: async () => {
      try {
        console.log("Fetching member savings directly");
        const result = await savingsService.getMySavings();
        console.log('Direct API response for member savings:', result);
        
        // Ensure we return an object with a data property that's an array
        return {
          data: Array.isArray(result.data) ? result.data : [],
          meta: result.meta || {}
        };
      } catch (error) {
        console.error('Error fetching member savings:', error);
        return { data: [], meta: {} }; // Return empty data instead of null
      }
    },
    staleTime: 600000,
    enabled: !monthlyTrend || monthlyTrend.length === 0  });
  
  // Generate mock data for debugging/development if everything else fails
  const mockData = useMemo(() => {
    console.log("Generating mock data for debugging");
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      year: currentYear,
      savings: Math.random() * 10000,
      shares: Math.random() * 5000
    }));
  }, []);
  
  // First, modify the savingsService.ts to include a method that gets all pages
  // Add this function to savingsService if not already there
  const { data: allSavingsData, isLoading: allSavingsLoading } = useQuery({
    queryKey: ['financial-insights-all-history', timeRange === 'ALL'],
    queryFn: async () => {
      if (timeRange === 'ALL') {
        try {
          console.log("Fetching ALL historical savings data");
          
          // First call to get initial page and total pages info
          const firstPageResult = await savingsService.getMySavings({ page: 1, limit: 50 });
          
          // Extract total pages from meta
          const { totalPages } = firstPageResult.meta;
          let allRecords = [...firstPageResult.data];
          
          // If we have more than one page, fetch the remaining pages
          if (totalPages > 1) {
            // Create an array of page numbers starting from 2
            const remainingPageNumbers = Array.from(
              { length: totalPages - 1 },
              (_, i) => i + 2
            );
            
            // Fetch all remaining pages in parallel
            const remainingPagesPromises = remainingPageNumbers.map(pageNum => 
              savingsService.getMySavings({ page: pageNum, limit: 50 })
            );
            
            const remainingPagesResults = await Promise.all(remainingPagesPromises);
            
            // Combine all records
            remainingPagesResults.forEach(pageResult => {
              allRecords = [...allRecords, ...pageResult.data];
            });
          }
          
          console.log(`Fetched total of ${allRecords.length} records from ${totalPages} pages`);
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
  
  // Process the data for charts with priority order:
  // 1. Props monthlyTrend (passed from parent)
  // 2. Direct API call result
  // 3. Mock data (fallback)
  const processedData = useMemo(() => {
    console.log("Processing chart data");
    
    // For ALL time range, use all historical data if available
    if (timeRange === 'ALL' && allSavingsData?.data && Array.isArray(allSavingsData.data)) {
      console.log("Using ALL historical data:", allSavingsData.data.length, "records");
      
      // Sort by year and month
      const sortedData = [...allSavingsData.data].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      
      return sortedData.map(item => ({
        month: item.month,
        year: item.year, // Keep year for ALL view
        savings: Number(item.balance || 0),
        shares: item.shares?.[0] ? Number(item.shares[0].totalAmount || 0) : 0
      }));
    }
    
    // Use props data first for non-ALL time ranges
    if (monthlyTrend && Array.isArray(monthlyTrend) && monthlyTrend.length > 0) {
      console.log("Using props monthlyTrend data");
      return monthlyTrend;
    }
    
    // Fall back to API call result (single page)
    if (savingsStats?.data && Array.isArray(savingsStats.data)) {
      console.log("Using direct API call data");
      
      // Sort data by year and month
      const sortedData = [...savingsStats.data].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
      
      // Add explicit type checking for required properties
      return sortedData.map(item => {
        if (!item || typeof item !== 'object') {
          console.warn('Invalid item in savings data:', item);
          return {
            month: 0,
            year: currentYear,
            savings: 0,
            shares: 0
          };
        }
        
        return {
          month: Number(item.month) || 0,
          year: Number(item.year) || currentYear,
          savings: Number(item.balance || 0),
          shares: Array.isArray(item.shares) && item.shares[0] 
            ? Number(item.shares[0].totalAmount || 0) 
            : 0
        };
      });
    }
    
    // Last resort - use mock data
    console.log("Falling back to mock data");
    return mockData;
  }, [monthlyTrend, savingsStats, mockData, timeRange, allSavingsData, currentYear]);
  
  // Apply time range filtering
  const filteredData = useMemo(() => {
    console.log("Filtering data by time range:", timeRange);
    let dataToFilter = [...processedData];
    
    if (timeRange === '3M') {
      return dataToFilter.slice(-3);
    } else if (timeRange === '6M') {
      return dataToFilter.slice(-6);
    } else if (timeRange === '1Y') {
      return dataToFilter.slice(-12);
    }
    
    return dataToFilter;
  }, [processedData, timeRange]);
  
  // Generate final chart data
  const chartData = useMemo(() => {
    console.log("Creating chart data object with filtered data:", filteredData);
    
    // For "ALL" time range, include year in labels
    const labels = timeRange === 'ALL' 
      ? filteredData.map(item => {
          return `${months[item.month - 1]} ${item.year || ''}`;
        })
      : filteredData.map(item => months[item.month - 1]);
    
    const savingsValues = filteredData.map(item => item.savings || 0);
    const sharesValues = filteredData.map(item => item.shares || 0);
    
    console.log("Chart labels:", labels);
    console.log("Chart savings values:", savingsValues);
    console.log("Chart shares values:", sharesValues);
    
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
        },
        {
          label: 'Shares',
          data: sharesValues,
          borderColor: theme.palette.success.main,
          backgroundColor: theme.palette.success.main + '40',
          fill: true,
          tension: 0.4,
        }
      ],
    };
  }, [filteredData, theme.palette.primary.main, theme.palette.success.main, timeRange]);
  
  // Add this to the chartOptions object
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
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
            Math.min(filteredData.length, 24) : 12, // Limit number of ticks for readability
        }
      },
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        ticks: {
          callback: function(tickValue: number | string) {
            if (typeof tickValue === 'number') {
              return '₦' + tickValue.toLocaleString();
            }
            return tickValue;
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  }), [timeRange, filteredData]);

  // Add debugging effects
  useEffect(() => {
    console.log("FinancialInsights component mounted");
    return () => {
      console.log("FinancialInsights component unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("Chart data updated:", chartData);
  }, [chartData]);

  useEffect(() => {
    console.log("Tab index changed to:", tabIndex);
  }, [tabIndex]);

  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        borderRadius: 2,
        boxShadow: `0 2px 14px 0 ${theme.palette.grey[200]}`,
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)}>
            <Tab label="Savings Growth" icon={<TrendingUp />} iconPosition="start" />
          </Tabs>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ButtonGroup size="small" aria-label="time range">
              {timeRanges.map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'contained' : 'outlined'}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </ButtonGroup>
            
            <ButtonGroup size="small" aria-label="chart type">
              {chartTypes.map((type) => (
                <Button
                  key={type}
                  variant={chartType === type ? 'contained' : 'outlined'}
                  onClick={() => setChartType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </ButtonGroup>
          </Box>
        </Box>
      </Box>
      
      <TabPanel value={tabIndex} index={0}>
        <Box sx={{ height: 350 }}>
          {savingsLoading && (!chartData || !chartData.labels.length) ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography>Loading chart data...</Typography>
            </Box>
          ) : !chartData || !chartData.labels.length ? (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography>No savings data available for the selected period</Typography>
            </Box>
          ) : chartType === 'line' ? (
            <Line options={chartOptions} data={chartData} />
          ) : (
            <Bar options={chartOptions} data={chartData} />
          )}
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Average Monthly Savings:
              </Typography>
              <Typography variant="h6">
                {chartData && chartData.datasets[0].data.length > 0 ? 
                  formatCurrency(
                    chartData.datasets[0].data.reduce((a, b) => a + b, 0) / 
                    (chartData.datasets[0].data.length || 1)
                  ) : 
                  '-'
                }
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Savings this period:
              </Typography>
              <Typography variant="h6">
                {chartData && chartData.datasets[0].data.length > 0 ? 
                  formatCurrency(
                    chartData.datasets[0].data.reduce((a, b) => a + b, 0)
                  ) : 
                  '-'
                }
              </Typography>
            </Box>
          </Box>
        </Box>
      </TabPanel>
      
      <TabPanel value={tabIndex} index={1}>
        <Card sx={{ height: '100%', borderRadius: 2 }}>
          <CardHeader 
            title="Financial Insights" 
            subheader="Monthly savings and shares contributions" 
          />
          <CardContent>
            <Box sx={{ height: 350, p: 1 }}>
              {filteredData.length > 0 ? (
                <Line 
                  data={chartData} 
                  options={chartOptions} 
                />
              ) : (
                <Box 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                  }}
                >
                  <Typography color="text.secondary">
                    No historical data available
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
    </Paper>
  );
};

export default FinancialInsights;
