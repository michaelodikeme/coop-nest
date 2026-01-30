'use client';

import React from 'react';
import WithdrawalRequests from '@/components/features/member/savings/WithdrawalRequests';
import { Container, Typography, Box } from '@mui/material';

export default function WithdrawalRequestsPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Withdrawal Requests
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Track the status of your past and pending withdrawal requests.
        </Typography>
        <WithdrawalRequests />
      </Box>
    </Container>
  );
}
