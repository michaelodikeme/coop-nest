"use client";

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Stack,
  Alert,
  AlertTitle,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import {
  usePersonalSavingsRequestDetails,
  useAdminProcessPersonalSavingsRequest
} from '@/lib/hooks/admin/useAdminPersonalSavings';
import { RequestStatus } from '@/types/personal-savings.types';
import { formatCurrency } from '@/utils/formatting/format';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';


type  paramsType = Promise<{ id: string }>
export default async function PersonalSavingsPendingRequestDetailPage({
  params
}: {
  params: paramsType
}) {
  // Access params directly - no need for use()
  const {id: requestId} = await params;

  const router = useRouter();
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'review' | 'completed'>('approve');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // Fetch request details using the ID directly
  const { data: request, isLoading, error } = usePersonalSavingsRequestDetails(requestId);

  // Process request mutation
  const processRequestMutation = useAdminProcessPersonalSavingsRequest();

  // Form for approval/rejection notes
  const { control, handleSubmit, reset } = useForm<{ notes: string }>({
    defaultValues: {
      notes: ''
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading request details...</Typography>
      </Box>
    );
  }

  if (error || !request) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        <AlertTitle>Error</AlertTitle>
        <Typography>
          Failed to load request details. {error?.message || 'Unknown error'}
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ mt: 2 }}
          onClick={() => router.push('/admin/approvals/personal-savings')}
        >
          Back to Approvals
        </Button>
      </Alert>
    );
  }

  // Extract data from request (accounting for possible structure differences)
  const data = request?.content || {};
  const planName = request?.content?.planName || 'New Personal Savings Plan';
  const targetAmount = request?.content?.targetAmount;
  const status = request?.status;
  const currentApprovalLevel = request?.nextApprovalLevel || 1;
  const approvalSteps = request?.approvalSteps || [];

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
      case RequestStatus.COMPLETED:
        return { color: 'success.main', label: 'Completed' };
      case RequestStatus.REJECTED:
        return { color: 'error.main', label: 'Rejected' };
      default:
        return { color: 'text.secondary', label: status };
    }
  };

  const statusDisplay = getStatusDisplay();

  const handleOpenDialog = (action: 'approve' | 'reject' | 'review' | 'completed' ) => {
    setApprovalAction(action);
    setIsDialogOpen(true);
    reset();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleProcessRequest = (data: { notes: string }) => {
    processRequestMutation.mutate(
      {
        requestId,
        action: approvalAction,
        notes: data.notes
      },
      {
        onSuccess: () => {
          handleCloseDialog();
          // Optionally, redirect back to approvals list after success
          router.push('/admin/approvals/personal-savings');
        }
      }
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          onClick={() => router.back()}
        >
          Back
        </Button>

        <Stack direction="row" spacing={2}>
          {status === RequestStatus.PENDING && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog('review')}
            >
              Review Request
            </Button>
          )}

          {status === RequestStatus.REVIEWED && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog('approve')}
            >
              Approve Request
            </Button>
          )}

        {status === RequestStatus.APPROVED && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog('completed')}
            >
              Complete Request
            </Button>
          )}

          {/* <Stack direction="row" spacing={2}> */}
          {status === RequestStatus.COMPLETED && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog('completed')}
            >
              Complete Request
            </Button>
          )}

          {(status === RequestStatus.PENDING || status === RequestStatus.IN_REVIEW) && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleOpenDialog('reject')}
            >
              Reject Request
            </Button>
          )}
        </Stack>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Personal Savings Request
      </Typography>

      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h5">
            {planName}
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
                  Member
                </Typography>
                <Typography variant="h6">
                  {request?.biodata?.fullName || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  ERP ID: {request?.biodata?.erpId || 'N/A'}
                </Typography>
                {request?.biodata?.department && (
                  <Typography variant="body2" color="text.secondary">
                    Department: {request.biodata.department}
                  </Typography>
                )}
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
                  Request ID
                </Typography>
                <Typography variant="body1">
                  {requestId}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Approval Status
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current Status:
            </Typography>
            <Typography variant="body1" color={statusDisplay.color} fontWeight="medium">
              {statusDisplay.label}
            </Typography>
          </Box>

          {approvalSteps.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Approval Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {approvalSteps.map((step: { level: string | number | bigint | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<React.AwaitedReactNode> | null | undefined; }, index: number) => (
                  <React.Fragment key={index}>
                    <Box
                      sx={{
                        width: 35,
                        height: 35,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        ...(Number(step.level ?? 0) < currentApprovalLevel
                          ? { bgcolor: 'success.light', color: 'success.contrastText', border: '1px solid', borderColor: 'success.main' }
                          : Number(step.level ?? 0) === currentApprovalLevel
                          ? { bgcolor: 'primary.light', color: 'primary.contrastText', border: '2px solid', borderColor: 'primary.main' }
                          : { bgcolor: 'grey.100', color: 'text.secondary', border: '1px solid', borderColor: 'grey.300' })
                      }}
                    >
                      {step.level}
                    </Box>
                    {index < approvalSteps.length - 1 && (
                      <Box sx={{ width: 50, height: 2, bgcolor: 'divider', mx: 1 }} />
                    )}
                  </React.Fragment>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Current: Level {currentApprovalLevel} ({approvalSteps.find((s: { level: any; }) => s.level === currentApprovalLevel)?.approverRole || 'Unknown'})
              </Typography>
            </Box>
          )}

          {request.notes && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Notes
              </Typography>
              <Typography variant="body1">
                {request.notes}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {data && Object.keys(data).length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Request Details
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(data)
                .filter(([key]) => !['planName', 'targetAmount'].includes(key))
                .map(([key, value]) => (
                  <React.Fragment key={key}>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {key.charAt(0).toUpperCase() + key.slice(1)}:
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 8 }}>
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

      {/* Approval/Rejection Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {approvalAction === 'approve' ? 'Approve Request' :
           approvalAction === 'reject' ? 'Reject Request' :
           'Review Request'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {approvalAction === 'approve' ? 'Approve this personal savings request?' :
             approvalAction === 'reject' ? 'Reject this personal savings request?' :
             'Move this request to review status?'}
          </DialogContentText>
          <form onSubmit={handleSubmit(handleProcessRequest)}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Notes (Optional)"
                  fullWidth
                  multiline
                  rows={3}
                  variant="outlined"
                  margin="normal"
                  {...field}
                />
              )}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit(handleProcessRequest)}
            variant="contained"
            color={approvalAction === 'reject' ? 'error' : 'primary'}
            disabled={processRequestMutation.isPending}
          >
            {processRequestMutation.isPending ? "Processing..." :
             approvalAction === 'approve' ? 'Approve' :
             approvalAction === 'reject' ? 'Reject' :
             approvalAction === 'completed' ? 'Completed' :
             'Move to Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


// import PersonalSavingsClient from './PersonalSavingsClient';
//
// type Props = {
//     params: { id: string };
// };
//
// export default function PersonalSavingsPendingRequestDetailPage({ params }: Props) {
//     return <PersonalSavingsClient requestId={params.id} />;
// }
