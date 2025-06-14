"use client";

import { PlanDetails } from '@/components/features/member/savings/personal/PlanDetails';
import { Paper } from '@mui/material';

export default function PersonalSavingsPlanPage({ params }: { params: { id: string } }) {
  return (
    <Paper sx={{ p: 3 }}>
      <PlanDetails id={params.id} />
    </Paper>
  );
}