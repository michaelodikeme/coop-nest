import { usePendingSavingsRequest } from '@/lib/hooks/member/usePersonalSavings';
import { RequestStatus } from '@/types/request.types';
import { formatCurrency } from '@/utils/formatting/format';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  Typography, 
  Grid, 
  Button,
  Chip,
  Stack,
  LinearProgress,
  Paper,
  Divider,
  Alert,
  AlertTitle
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import React from 'react';

import type { ApprovalStep as ImportedApprovalStep } from '@/types/request.types';

interface ApprovalProgressProps {
  steps: ImportedApprovalStep[];
  currentLevel: number;
}

function ApprovalProgress({ steps, currentLevel }: ApprovalProgressProps) {
  if (!steps || steps.length === 0) return null;
  
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center">
        {steps.map((step, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'medium',
                ...(step.level < currentLevel
                  ? { bgcolor: 'success.light', color: 'success.contrastText', border: '1px solid', borderColor: 'success.main' }
                  : step.level === currentLevel
                  ? { bgcolor: 'primary.light', color: 'primary.contrastText', border: '2px solid', borderColor: 'primary.main' }
                  : { bgcolor: 'grey.100', color: 'text.secondary', border: '1px solid', borderColor: 'grey.300' })
              }}
            >
              {step.level}
            </Box>
            {index < steps.length - 1 && (
              <Box sx={{ width: 24, height: 1, bgcolor: 'grey.300', mx: 0.5 }} />
            )}
          </Box>
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Current: Level {currentLevel} ({steps.find(s => s.level === currentLevel)?.approverRole || 'Unknown'})
      </Typography>
    </Box>
  );
}

interface PendingSavingsRequestDetailsProps {
  requestId: string;
}

export function PendingSavingsRequestDetails({ requestId }: PendingSavingsRequestDetailsProps) {
  const { data: request, isLoading, error } = usePendingSavingsRequest(requestId);
  const router = useRouter();
  
  if (isLoading) {
    return <LinearProgress sx={{ my: 4 }} />;
  }
  
  if (error || !request) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        <AlertTitle>Error</AlertTitle>
        <Typography>
          Failed to load request details. Please try again later.
        </Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          sx={{ mt: 2 }}
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </Alert>
    );
  }
  
  const planName = request.content?.planName || 'New Savings Plan';
  const targetAmount = request.content?.targetAmount;
  const status = request.status;
  const currentApprovalLevel = request.nextApprovalLevel || 1;
  const approvalSteps = request.approvalSteps || [];
  
  // Determine status display
  const getStatusDisplay = () => {
    switch (status) {
      case RequestStatus.PENDING:
        return { color: 'warning.main', label: 'Pending Approval' };
      case RequestStatus.IN_REVIEW:
        return { color: 'info.main', label: 'In Review' };
      case RequestStatus.REVIEWED:
        return { color: 'secondary.main', label: 'Reviewed' };
      case RequestStatus.APPROVED:
        return { color: 'success.main', label: 'Approved' };
      case RequestStatus.REJECTED:
        return { color: 'error.main', label: 'Rejected' };
      default:
        return { color: 'text.secondary', label: status };
    }
  };
  
  const statusDisplay = getStatusDisplay();
  
  return (
    <Box>
      <Box mb={3}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          onClick={() => router.push('/member/savings/personal')}
        >
          Back to Plans
        </Button>
      </Box>
      
      <Typography variant="h4" fontWeight="bold" mb={3}>
        {planName}
      </Typography>
      
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h6">
            Plan Request Details
          </Typography>
          <Chip 
            label={statusDisplay.label} 
            sx={{ color: 'white', bgcolor: statusDisplay.color }}
          />
        </Box>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Request ID
                </Typography>
                <Typography variant="body1">
                  {requestId}
                </Typography>
              </CardContent>
            </Card>
            
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Target Amount
                </Typography>
                <Typography variant="h6">
                  {targetAmount ? formatCurrency(Number(targetAmount)) : 'Not specified'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Submitted On
                </Typography>
                <Typography variant="body1">
                  {new Date(request.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
            
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {new Date(request.updatedAt).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      <Card sx={{ mb: 4 }}>
        <CardHeader title="Approval Status" />
        <CardContent>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current Status
            </Typography>
            <Typography variant="body1" color={statusDisplay.color} fontWeight="medium">
              {statusDisplay.label}
            </Typography>
          </Box>
          
          {approvalSteps.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" gutterBottom>
                Approval Progress
              </Typography>
              <ApprovalProgress steps={approvalSteps} currentLevel={currentApprovalLevel} />
            </>
          )}
          
          {request.notes && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Notes
              </Typography>
              <Typography variant="body1">
                {request.notes}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
      
      {request.content && Object.keys(request.content).length > 0 && (
        <Card>
          <CardHeader title="Additional Details" />
          <CardContent>
            <Grid container spacing={2}>
              {Object.entries(request.content)
                .filter(([key]) => !['planName', 'targetAmount'].includes(key))
                .map(([key, value]) => (
                  <React.Fragment key={key}>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        {key.charAt(0).toUpperCase() + key.slice(1)}:
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="body1">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </Typography>
                    </Grid>
                  </React.Fragment>
                ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}