'use client';
import React from 'react';
import {Typography, Paper, Grid, Card, CardContent, CircularProgress } from '@mui/material';
import { usePersonalSavingsPlan } from '@/lib/hooks/member/usePersonalSavings';
import { formatCurrency, formatDate } from '@/utils/formatting/format';

const Overview = ({ planId }: { planId: string }) => {
  const { data: planData, isLoading } = usePersonalSavingsPlan(planId);
  const plan = planData?.data;

  if (isLoading) {
    return <CircularProgress />;
  }

  if (!plan) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No plan details available.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Personal Savings Overview
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">
                Plan Name
              </Typography>
              <Typography variant="h5">{plan.planName || 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">
                Current Balance
              </Typography>
              <Typography variant="h5">{formatCurrency(plan.currentBalance)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">
                Target Amount
              </Typography>
              <Typography variant="h5">{plan.targetAmount ? formatCurrency(plan.targetAmount) : 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">
                Maturity Date
              </Typography>
              <Typography variant="h5">{plan.maturityDate ? formatDate(plan.maturityDate) : 'N/A'}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Overview;