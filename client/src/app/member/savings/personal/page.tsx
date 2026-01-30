"use client";

import { MemberSummary } from '@/components/features/member/savings/personal/MemberSummary';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export default function PersonalSavingsPage() {
  const router = useRouter();

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Personal Savings
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => router.push('/member/savings/personal/create')}
        >
          New Savings Plan
        </Button>
      </Box>
      <MemberSummary />
    </Paper>
  );
}
