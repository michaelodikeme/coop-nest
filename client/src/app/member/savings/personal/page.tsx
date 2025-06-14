"use client";

import { MemberSummary } from '@/components/features/member/savings/personal/MemberSummary';
import { PlansList } from '@/components/features/member/savings/personal/PlansList';
import { Box, Paper } from '@mui/material';

export default function PersonalSavingsPage() {
  return (
    <Paper sx={{ p: 3 }}>
      <Box className="space-y-8">
        <MemberSummary />
        <PlansList />
      </Box>
    </Paper>
  );
}