"use client";

import { CreatePlanForm } from '@/components/features/member/savings/personal/CreatePlanForm';
import { Paper } from '@mui/material';

export default function CreatePersonalSavingsPage() {
  return (
    <Paper sx={{ p: 3 }}>
      <CreatePlanForm />
    </Paper>
  );
}