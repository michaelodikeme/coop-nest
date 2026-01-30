'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button,
  Tabs,
  Tab,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  ButtonGroup, 
  alpha, 
} from '@mui/material';
import { 
  ReferenceLine,
  BarChart,
  Bar,
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import { 
  useAdminPersonalSavingsPlan, 
  useAdminClosePlan,
  useAdminProcessDeposit,
  useAdminTransactionHistory,
  useAdminBalanceHistory
} from '@/lib/hooks/admin/useAdminPersonalSavings';
import { formatCurrency } from '@/utils/formatting/format';
import { PersonalSavingsStatus, TransactionType } from '@/types/personal-savings.types';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/organisms/DataTable';
import DateRangeSelector from '@/components/molecules/DateRangeSelector';
import LoadingScreen from '@/components/atoms/LoadingScreen';
import ErrorIcon from '@mui/icons-material/Error';
import { Controller, useForm } from 'react-hook-form';

export default async function PersonalSavingsPlanDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params;
  const planId = resolvedParams.id;

  return <PersonalSavingsPlanDetailPageClient planId={planId} />;
}

function PersonalSavingsPlanDetailPageClient({ planId }: { planId: string }) {
  const [tabValue, setTabValue] = useState(0);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null });
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const router = useRouter();
  
  const { data: plan, isLoading, error } = useAdminPersonalSavingsPlan(planId);
  const closePlanMutation = useAdminClosePlan();
  const depositMutation = useAdminProcessDeposit();
  
  const { data: transactions, isLoading: isLoadingTransactions } = useAdminTransactionHistory(
    planId,
    {
      startDate: dateRange.startDate?.toISOString(),
      endDate: dateRange.endDate?.toISOString(),
      page: 1,
      limit: 100
    }
  );
  
  const { data: balanceHistory, isLoading: isLoadingBalance } = useAdminBalanceHistory(
    planId,
    {
      startDate: dateRange.startDate?.toISOString(),
      endDate: dateRange.endDate?.toISOString()
    }
  );
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      amount: '',
      description: ''
    }
  });
  
  const handleChangeTab = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleProcessDeposit = (data: { amount: string, description: string }) => {
    depositMutation.mutate({
      id: planId,
      data: {
        amount: Number(data.amount),
        description: data.description
      }
    }, {
      onSuccess: () => {
        setDepositDialogOpen(false);
        reset();
      }
    });
  };
  
  const handleClosePlan = () => {
    closePlanMutation.mutate(planId, {
      onSuccess: () => {
        setCloseDialogOpen(false);
      }
    });
  };
  
  if (isLoading) {
    return <LoadingScreen message="Loading plan details..." />;
  }
  
  if (error || !plan) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '50vh' 
      }}>
        <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" gutterBottom>Failed to load plan details</Typography>
        <Typography color="text.secondary">The plan might not exist or you might not have permission to view it.</Typography>
        <Button 
          variant="outlined" 
          sx={{ mt: 2 }} 
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  const isActive = plan.status === PersonalSavingsStatus.ACTIVE;
  const canClose = isActive && plan.currentBalance === 0;
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>{plan.planName || "Personal Savings Plan"}</Typography>
          <Typography color="text.secondary">Member: {plan.member.name}</Typography>
        </Box>
        <Box>
          {isActive && (
            <Button 
              variant="contained"
              color="primary"
              sx={{ mr: 1 }}
              onClick={() => setDepositDialogOpen(true)}
            >
              Process Deposit
            </Button>
          )}
          <Button 
            variant="outlined"
            color="error"
            disabled={!canClose}
            onClick={() => setCloseDialogOpen(true)}
          >
            Close Plan
          </Button>
        </Box>
      </Box>
      
      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2">Current Balance</Typography>
              <Typography variant="h4" sx={{ my: 1 }}>
                {formatCurrency(plan.currentBalance ?? 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2">Status</Typography>
              <Box sx={{ my: 1 }}>
                <Chip 
                  label={plan.status}
                  color={
                    plan.status === PersonalSavingsStatus.ACTIVE ? 'success' :
                    plan.status === PersonalSavingsStatus.CLOSED ? 'default' : 'warning'
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2">Target Amount</Typography>
              <Typography variant="h4" sx={{ my: 1 }}>
                {plan.targetAmount ? formatCurrency(plan.targetAmount) : 'Not Set'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2">Created On</Typography>
              <Typography variant="h6" sx={{ my: 1 }}>
                {new Date(plan.createdAt).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={handleChangeTab} sx={{ mb: 2 }}>
          <Tab label="Details" />
          <Tab label="Transactions" />
          <Tab label="Balance History" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardHeader title="Member Information" />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Typography color="text.secondary" variant="body2">Name</Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <Typography variant="body2">{plan.member.name}</Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 4 }}>
                      <Typography color="text.secondary" variant="body2">ERP ID</Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <Typography variant="body2">{plan.erpId}</Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 4 }}>
                      <Typography color="text.secondary" variant="body2">Department</Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <Typography variant="body2">{plan.member.department}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardHeader title="Plan Information" />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Typography color="text.secondary" variant="body2">Plan ID</Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <Typography variant="body2">{plan.id}</Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 4 }}>
                      <Typography color="text.secondary" variant="body2">Plan Name</Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <Typography variant="body2">{plan.planName || 'Not Set'}</Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 4 }}>
                      <Typography color="text.secondary" variant="body2">Last Updated</Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <Typography variant="body2">{new Date(plan.updatedAt).toLocaleDateString()}</Typography>
                    </Grid>
                    
                    <Grid size={{ xs: 4 }}>
                      <Typography color="text.secondary" variant="body2">Plan Type ID</Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                      <Typography variant="body2">{plan.planTypeId}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Transaction History</Typography>
            <DateRangeSelector
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={(start, end) => setDateRange({ startDate: start, endDate: end })} onReset={function (): void {
                throw new Error('Function not implemented.');
              } }            />
          </Box>
          
          {isLoadingTransactions ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <LoadingScreen message="Loading transactions..." />
            </Box>
          ) : transactions && transactions.data && transactions.data.length > 0 ? (
            <DataTable 
              data={transactions.data}
              columns={[
                {
                  label: 'Transaction Type',
                  accessor: 'transactionType',
                  Cell: ({ value }) => (
                    <Typography
                      variant="body2"
                      color={value === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? 'success.main' : 'error.main'}
                    >
                      {value === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? 'Deposit' : 'Withdrawal'}
                    </Typography>
                  ),
                  id: ''
                },
                {
                  label: 'Amount',
                  accessor: 'amount',
                  Cell: ({ value, row }) => (
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      color={row.original.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? 'success.main' : 'error.main'}
                    >
                      {row.original.transactionType === TransactionType.PERSONAL_SAVINGS_DEPOSIT ? '+' : '-'}
                      {formatCurrency(value)}
                    </Typography>
                  ),
                  id: ''
                },
                {
                  label: 'Date',
                  accessor: 'createdAt',
                  Cell: ({ value }) => (
                    <Typography variant="body2">{new Date(value).toLocaleString()}</Typography>
                  ),
                  id: ''
                },
                {
                  label: 'Status',
                  accessor: 'status',
                  Cell: ({ value }) => (
                    <Chip
                      label={value}
                      size="small"
                      color={value === 'COMPLETED' ? 'success' : 'default'} />
                  ),
                  id: ''
                },
                {
                  label: 'Description',
                  accessor: 'description',
                  Cell: ({ value }) => (
                    <Typography variant="body2">{value || 'No description'}</Typography>
                  ),
                  id: ''
                }
              ]}
            />
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No transactions found</Typography>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight="medium">Balance History</Typography>
              <Typography variant="body2" color="text.secondary">
                Track changes in savings balance over time
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Time range selector buttons */}
              <ButtonGroup size="small" aria-label="time range">
                <Button 
                  variant={timeRange === 'daily' ? 'contained' : 'outlined'}
                  onClick={() => setTimeRange('daily')}
                >
                  Daily
                </Button>
                <Button 
                  variant={timeRange === 'weekly' ? 'contained' : 'outlined'}
                  onClick={() => setTimeRange('weekly')}
                >
                  Weekly
                </Button>
                <Button 
                  variant={timeRange === 'monthly' ? 'contained' : 'outlined'}
                  onClick={() => setTimeRange('monthly')}
                >
                  Monthly
                </Button>
              </ButtonGroup>
              
              <DateRangeSelector
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onDateChange={(start, end) => setDateRange({ startDate: start, endDate: end })}
                onReset={() => setDateRange({ startDate: null, endDate: null })}
              />
            </Box>
          </Box>
          
          {isLoadingBalance ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <LoadingScreen message="Loading balance history..." />
            </Box>
          ) : balanceHistory && ((timeRange === 'monthly' ? balanceHistory.monthly : balanceHistory.daily)?.length > 0) ? (
            <Grid container spacing={3}>
              {/* Summary cards */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="subtitle2">Average Balance</Typography>
                    <Typography variant="h5" sx={{ my: 1, fontWeight: 'medium' }}>
                      {formatCurrency(
                        calculateAverage(
                          timeRange === 'monthly'
                            ? balanceHistory.monthly
                            : balanceHistory.daily
                        )
                      )}
                    </Typography>
                    {calculateTrend(
                      timeRange === 'monthly'
                        ? balanceHistory.monthly
                        : balanceHistory.daily
                    ) > 0 ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                        <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">
                          {calculateTrend(
                            timeRange === 'monthly'
                              ? balanceHistory.monthly
                              : balanceHistory.daily
                          ).toFixed(2)}% increase
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                        <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <Typography variant="body2">
                          {Math.abs(
                            calculateTrend(
                              timeRange === 'monthly'
                                ? balanceHistory.monthly
                                : balanceHistory.daily
                            )
                          ).toFixed(2)}% decrease
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="subtitle2">Highest Balance</Typography>
                    <Typography variant="h5" sx={{ my: 1, fontWeight: 'medium' }}>
                      {formatCurrency(
                        calculateHighest(
                          timeRange === 'monthly'
                            ? balanceHistory.monthly
                            : balanceHistory.daily
                        )
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getDateForHighest(timeRange === 'monthly' ? balanceHistory.monthly : balanceHistory.daily)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="subtitle2">Lowest Balance</Typography>
                    <Typography variant="h5" sx={{ my: 1, fontWeight: 'medium' }}>
                      {formatCurrency(
                        calculateLowest(
                          timeRange === 'monthly'
                            ? balanceHistory.monthly
                            : balanceHistory.daily
                        )
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getDateForLowest(timeRange === 'monthly' ? balanceHistory.monthly : balanceHistory.daily)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography color="text.secondary" variant="subtitle2">Growth Rate</Typography>
                    <Typography variant="h5" sx={{ my: 1, fontWeight: 'medium' }}>
                      {calculateGrowthRate(timeRange === 'monthly' ? balanceHistory.monthly : balanceHistory.daily).toFixed(2)}%
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      color: calculateGrowthRate(timeRange === 'monthly' ? balanceHistory.monthly : balanceHistory.daily) >= 0 ? 'success.main' : 'error.main'
                    }}>
                      {calculateGrowthRate(timeRange === 'monthly' ? balanceHistory.monthly : balanceHistory.daily) >= 0 ? (
                        <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                      )}
                      <Typography variant="body2">
                        {calculateGrowthRate(timeRange === 'monthly' ? balanceHistory.monthly : balanceHistory.daily) >= 0 ? 'Positive' : 'Negative'} trend
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Main chart */}
              <Grid size={{ xs: 12 }}>
                <Card>
                  <CardContent>
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={timeRange === 'monthly' ? balanceHistory.monthly : balanceHistory.daily}
                          margin={{
                            top: 10,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return timeRange === 'monthly' 
                                ? date.toLocaleDateString('default', { month: 'short', year: 'numeric' })
                                : date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                            }}
                            tick={{ fontSize: 12 }}
                            tickMargin={10}
                            axisLine={{ stroke: '#e0e0e0' }}
                          />
                          <YAxis 
                            tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                            tick={{ fontSize: 12 }}
                            domain={['dataMin - 1000', 'dataMax + 1000']}
                            axisLine={{ stroke: '#e0e0e0' }}
                          />
                          <Tooltip 
                            labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString('default', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric'
                            })}`}
                            formatter={(value, name) => [formatCurrency(Number(value)), name]}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '6px',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                              border: 'none',
                              padding: '10px 14px'
                            }}
                          />
                          <Legend wrapperStyle={{ paddingTop: 10 }} />
                          <defs>
                            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                            fill="url(#balanceGradient)" 
                            activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 1, fill: '#fff' }} 
                            name="Balance"
                            animationDuration={1000}
                            animationEasing="ease-in-out"
                          />
                          {/* Render reference line for average balance */}
                          <ReferenceLine 
                            y={calculateAverage(timeRange === 'monthly' ? balanceHistory.monthly : balanceHistory.daily)} 
                            stroke="#ff7300"
                            strokeDasharray="3 3"
                            label={{
                              value: 'Average', 
                              position: 'insideBottomRight',
                              fill: '#ff7300',
                              fontSize: 12
                            }} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Smaller charts for specific metrics */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardHeader 
                    title="Weekly Growth Pattern" 
                    titleTypographyProps={{ variant: 'subtitle1' }}
                  />
                  <CardContent>
                    <Box sx={{ height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getWeeklyData(balanceHistory.daily)}
                          margin={{
                            top: 10,
                            right: 30,
                            left: 20,
                            bottom: 20,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="week" 
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => formatCurrency(value, { notation: 'compact' })}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [formatCurrency(Number(value)), 'Average Balance']}
                            labelFormatter={label => `Week of ${label}`}
                          />
                          <Bar 
                            dataKey="avgBalance" 
                            name="Average Balance"
                            fill="#82ca9d" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6 }}>
                <Card>
                  <CardHeader 
                    title="Balance Distribution" 
                    titleTypographyProps={{ variant: 'subtitle1' }}
                  />
                  <CardContent>
                    <Box sx={{ height: 250 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getBalanceDistribution(balanceHistory.daily)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {getBalanceDistribution(balanceHistory.daily).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(Number(Array.isArray(value) ? value[0] : value))} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ 
              py: 8, 
              textAlign: 'center',
              backgroundColor: theme => theme.palette.mode === 'light' ? alpha('#f5f5f5', 0.7) : alpha('#333', 0.4),
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}>
              <TimelineOutlinedIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />
              <Typography color="text.secondary" variant="h6">No balance history available</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ maxWidth: 400 }}>
                There isn't enough historical data to display the balance chart for this savings plan.
                Data will appear as transactions are processed.
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>
      
      {/* Deposit Dialog */}
      <Dialog 
        open={depositDialogOpen} 
        onClose={() => setDepositDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Process Deposit</DialogTitle>
        <form onSubmit={handleSubmit(handleProcessDeposit)}>
          <DialogContent>
            {!isActive && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This plan is not active. Deposits can only be processed for active plans.
              </Alert>
            )}
            
            <Controller
              name="amount"
              control={control}
              rules={{ 
                required: 'Amount is required',
                pattern: {
                  value: /^[0-9]+(\.[0-9]{1,2})?$/,
                  message: 'Enter a valid amount (up to 2 decimal places)'
                }
              }}
              render={({ field }) => (
                <TextField
                  label="Amount"
                  type="number"
                  fullWidth
                  margin="normal"
                  disabled={!isActive || depositMutation.isPending}
                  error={!!errors.amount}
                  helperText={errors.amount?.message as string}
                  {...field}
                />
              )}
            />
            
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Description (Optional)"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={3}
                  disabled={!isActive || depositMutation.isPending}
                  {...field}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDepositDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={!isActive || depositMutation.isPending}
            >
              {depositMutation.isPending ? 'Processing...' : 'Process Deposit'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Close Plan Dialog */}
      <Dialog
        open={closeDialogOpen}
        onClose={() => setCloseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Close Personal Savings Plan</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to close this personal savings plan?
          </Typography>
          
          {!canClose && (plan.currentBalance ?? 0) > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              This plan cannot be closed because it still has a balance of {formatCurrency(plan.currentBalance ?? 0)}.
              The balance must be zero to close a plan.
            </Alert>
          )}
          
          {!isActive && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This plan is already {plan.status.toLowerCase()}.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained"
            color="error"
            onClick={handleClosePlan}
            disabled={!canClose || closePlanMutation.isPending}
          >
            {closePlanMutation.isPending ? 'Processing...' : 'Close Plan'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Custom TabPanel component
function TabPanel(props: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

// Color array for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Utility functions for chart calculations
const calculateAverage = (data: any[]) => {
  if (!data || data.length === 0) return 0;
  return data.reduce((sum, item) => sum + Number(item.balance), 0) / data.length;
};

const calculateHighest = (data: any[]) => {
  if (!data || data.length === 0) return 0;
  return Math.max(...data.map(item => Number(item.balance)));
};

const calculateLowest = (data: any[]) => {
  if (!data || data.length === 0) return 0;
  return Math.min(...data.map(item => Number(item.balance)));
};

const getDateForHighest = (data: any[]) => {
  if (!data || data.length === 0) return 'N/A';
  const highest = calculateHighest(data);
  const highestItem = data.find(item => Number(item.balance) === highest);
  return highestItem ? new Date(highestItem.date).toLocaleDateString('default', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  }) : 'N/A';
};

const getDateForLowest = (data: any[]) => {
  if (!data || data.length === 0) return 'N/A';
  const lowest = calculateLowest(data);
  const lowestItem = data.find(item => Number(item.balance) === lowest);
  return lowestItem ? new Date(lowestItem.date).toLocaleDateString('default', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  }) : 'N/A';
};

const calculateTrend = (data: any[]) => {
  if (!data || data.length < 2) return 0;
  
  // Get first and last points
  const firstValue = Number(data[0].balance);
  const lastValue = Number(data[data.length - 1].balance);
  
  if (firstValue === 0) return 0; // Avoid division by zero
  return ((lastValue - firstValue) / firstValue) * 100;
};

const calculateGrowthRate = (data: any[]) => {
  if (!data || data.length < 2) return 0;
  
  // Calculate compounded growth rate
  const firstValue = Number(data[0].balance);
  const lastValue = Number(data[data.length - 1].balance);
  const periods = data.length - 1;
  
  if (firstValue <= 0) return 0; // Invalid for calculation
  
  // (lastValue / firstValue)^(1/periods) - 1
  const rate = Math.pow(lastValue / firstValue, 1 / periods) - 1;
  return rate * 100; // Convert to percentage
};

const getWeeklyData = (data: any[]) => {
  if (!data || data.length === 0) return [];
  
  // Group data by week
  const weekMap = new Map();
  
  data.forEach(item => {
    const date = new Date(item.date);
    // Get start of week (assuming Sunday is first day)
    date.setDate(date.getDate() - date.getDay());
    const weekKey = date.toISOString().split('T')[0];
    
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { 
        week: date.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        values: [],
        count: 0,
        total: 0
      });
    }
    
    const weekData = weekMap.get(weekKey);
    weekData.values.push(Number(item.balance));
    weekData.total += Number(item.balance);
    weekData.count += 1;
  });
  
  // Calculate average for each week
  return Array.from(weekMap.values()).map(week => ({
    week: week.week,
    avgBalance: week.total / week.count
  }));
};

const getBalanceDistribution = (data: any[]) => {
  if (!data || data.length === 0) return [];
  
  // Create balance ranges
  const min = calculateLowest(data);
  const max = calculateHighest(data);
  const range = max - min;
  
  if (range === 0) return [{ name: 'Equal Balance', value: 1 }];
  
  const segment = range / 4;
  const ranges = [
    { name: `${formatCurrency(min)} - ${formatCurrency(min + segment)}`, min: min, max: min + segment, value: 0 },
    { name: `${formatCurrency(min + segment)} - ${formatCurrency(min + 2*segment)}`, min: min + segment, max: min + 2*segment, value: 0 },
    { name: `${formatCurrency(min + 2*segment)} - ${formatCurrency(min + 3*segment)}`, min: min + 2*segment, max: min + 3*segment, value: 0 },
    { name: `${formatCurrency(min + 3*segment)} - ${formatCurrency(max)}`, min: min + 3*segment, max: max, value: 0 }
  ];
  
  // Count values in each range
  data.forEach(item => {
    const balance = Number(item.balance);
    for (const range of ranges) {
      if (balance >= range.min && balance <= range.max) {
        range.value++;
        break;
      }
    }
  });
  
  return ranges.filter(range => range.value > 0);
};
