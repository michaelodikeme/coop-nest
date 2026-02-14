import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  useTheme,
  CircularProgress,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsService } from '@/lib/api';
import { formatDate, formatCurrency } from '@/utils/formatting/format';

interface WithdrawalRequestsProps {
  maxAmount?: number;
  personalSavingsId?: string;
}

const WithdrawalRequests: React.FC<WithdrawalRequestsProps> = ({
  maxAmount = 0,
  personalSavingsId
}) => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  /** Fetch withdrawal requests */
  const { data, isLoading } = useQuery({
    queryKey: ['withdrawal-requests', personalSavingsId],
    queryFn: () => savingsService.getWithdrawalRequests(),
    staleTime: 5 * 60 * 1000,
    select: (res) => {
      if (!res?.data) return [];
      if (!personalSavingsId) return res.data;
      return res.data.filter((r: any) => r.personalSavingsId === personalSavingsId);
    }
  });

  /** Cancel mutation */
  const cancelMutation = useMutation({
    mutationFn: (id: string) => savingsService.cancelWithdrawalRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['savings-summary'] });
      setOpenCancelDialog(false);
      setSelectedRequest(null);
    }
  });

  const renderStatusChip = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Chip size="small" color="warning" icon={<AccessTimeIcon />} label="Pending" />;
      case 'IN_REVIEW':
        return <Chip size="small" color="primary" icon={<PersonIcon />} label="In Review" />;
      case 'APPROVED':
        return <Chip size="small" color="info" icon={<CheckIcon />} label="Approved" />;
      case 'COMPLETED':
        return <Chip size="small" color="success" icon={<CheckIcon />} label="Completed" />;
      case 'REJECTED':
        return <Chip size="small" color="error" icon={<CancelIcon />} label="Rejected" />;
      default:
        return <Chip size="small" label={status} />;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const requests = Array.isArray(data) ? data : [];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Withdrawal Requests
      </Typography>

      {requests.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center', bgcolor: theme.palette.grey[50], borderRadius: 2 }}>
          <Typography color="text.secondary">
            No withdrawal requests found
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {requests.map((request: any) => {
            const expanded = expandedCards[request.id] ?? false;

            return (
              <Card key={request.id} variant="outlined">
                <CardContent>
                  <Box
                    onClick={() => toggleExpand(request.id)}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <Box>
                      <Typography fontWeight={500}>
                        {formatCurrency(Number(request.rawAmount || 0))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(request.requestDate)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {renderStatusChip(request.status)}
                      <IconButton
                        size="small"
                        sx={{
                          ml: 1,
                          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}
                      >
                        <KeyboardArrowDownIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Reason:</strong> {request.reason || '—'}
                  </Typography>

                  <Collapse in={expanded}>
                    <Divider sx={{ my: 2 }} />

                    {request.savings && (
                      <Box sx={{ bgcolor: theme.palette.grey[50], p: 2, borderRadius: 1 }}>
                        <Typography fontWeight={500} gutterBottom>
                          Financial Impact
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              Current Balance
                            </Typography>
                            <Typography>
                              {request.savings.totalSavings.formatted}
                            </Typography>
                          </Grid>

                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">
                              After Withdrawal
                            </Typography>
                            <Typography>
                              {request.savings.remainingBalance.formatted}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Collapse>

                  {request.status === 'PENDING' && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => {
                          setSelectedRequest(request.id);
                          setOpenCancelDialog(true);
                        }}
                      >
                        Cancel Request
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Cancel dialog */}
      <Dialog
        open={openCancelDialog}
        onClose={() => !cancelMutation.isPending && setOpenCancelDialog(false)}
      >
        <DialogTitle>Cancel Withdrawal Request?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" icon={<InfoIcon />}>
            This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>No</Button>
          <Button
            color="error"
            variant="contained"
            disabled={cancelMutation.isPending}
            onClick={() => selectedRequest && cancelMutation.mutate(selectedRequest)}
          >
            {cancelMutation.isPending ? 'Cancelling…' : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WithdrawalRequests;
