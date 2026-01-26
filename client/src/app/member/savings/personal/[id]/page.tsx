import { PlanDetails } from '@/components/features/member/savings/personal/PlanDetails';
import { Paper } from '@mui/material';

export default async function PersonalSavingsPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return <PersonalSavingsPlanPageClient id={id} />;
}

function PersonalSavingsPlanPageClient({ id }: { id: string }) {
  return (
    <Paper sx={{ p: 3 }}>
      <PlanDetails id={id} />
    </Paper>
  );
}
