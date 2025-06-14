import { Box, Stepper, Step, StepLabel, Typography, Chip, Avatar } from '@mui/material';

type ApprovalStatus = 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'SKIPPED';

interface ApprovalStep {
  level: number;
  status: ApprovalStatus;
  approverRole: string;
  approverId?: string;
  approvedAt?: Date | string | null;
  notes?: string;
}

interface ApprovalChainProps {
  steps: ApprovalStep[];
  currentLevel?: number;
}

export function ApprovalChain({ steps, currentLevel }: ApprovalChainProps) {
  // Get the active step based on approval levels
  const getActiveStep = () => {
    // Find the first pending step
    const pendingStep = steps.findIndex(step => step.status === 'PENDING');
    if (pendingStep !== -1) return pendingStep;
    
    // If all are completed, return the last step
    const lastCompletedStep = steps
      .map((step, index) => ({ index, step }))
      .filter(item => item.step.status === 'APPROVED')
      .pop();
      
    return lastCompletedStep ? lastCompletedStep.index : steps.length - 1;
  };
  
  // Get status icon/color based on step status
  const getStatusInfo = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return { color: 'success', icon: '✓' };
      case 'REJECTED':
        return { color: 'error', icon: '✗' };
      case 'IN_PROGRESS':
        return { color: 'info', icon: '⟳' };
      case 'PENDING':
        return { color: 'warning', icon: '⌛' };
      case 'SKIPPED':
        return { color: 'default', icon: '⤑' };
      default:
        return { color: 'default', icon: '◯' };
    }
  };
  
  // Sort steps by level
  const sortedSteps = [...steps].sort((a, b) => a.level - b.level);
  
  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Stepper activeStep={getActiveStep()} alternativeLabel>
        {sortedSteps.map((step, index) => {
          const statusInfo = getStatusInfo(step.status);
          const isActive = step.level === currentLevel;
          
          return (
            <Step key={step.level} completed={step.status === 'APPROVED'}>
              <StepLabel
                StepIconProps={{
                  active: isActive,
                  error: step.status === 'REJECTED',
                }}
                optional={
                  <Box sx={{ textAlign: 'center', mt: 1 }}>
                    <Typography variant="caption" display="block">
                      {step.approverRole}
                    </Typography>
                    {step.status !== 'PENDING' && (
                      <Chip 
                        label={step.status} 
                        size="small" 
                        color={statusInfo.color as any}
                        sx={{ mt: 0.5 }}
                      />
                    )}
                    {step.approvedAt && (
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {new Date(step.approvedAt).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                }
              >
                Level {step.level}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
}