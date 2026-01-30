"use client";

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Chip,
  Stack,
  Tooltip,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { DataTable } from '@/components/organisms/DataTable';
import { 
  useAdminPendingPersonalSavingsRequests,
  useAdminPendingPersonalSavingsWithdrawals,
  useAdminProcessPersonalSavingsRequest,
} from '@/lib/hooks/admin/useAdminPersonalSavings';
import { formatCurrency, formatDate } from '@/utils/formatting/format';
import { RequestStatus } from '@/types/personal-savings.types';
import { useRouter } from 'next/navigation';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface ApprovalDialogData {
  requestId: string;
  action: 'approve' | 'reject' | 'review';
  notes: string;
}

const PersonalSavingsApprovalsPage = () => {
  const [tabValue, setTabValue] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | 'review'>('approve');
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  
  const router = useRouter();
  
  // Fetch creation requests
  const { 
    data: creationRequests, 
    isLoading: isCreationLoading,
    error: creationError
  } = useAdminPendingPersonalSavingsRequests(
    page + 1,  // API expects 1-indexed pages
    pageSize,
    tabValue === 0 ? 'PENDING' : 
    tabValue === 1 ? 'IN_REVIEW' : 
    tabValue === 2 ? 'REVIEWED' : 
    undefined // Only undefined for withdrawals, which are handled separately
  );
  
  // Fetch withdrawal requests - fetch all pending withdrawals when on withdrawals tab
  const {
    data: withdrawalRequests,
    isLoading: isWithdrawalLoading,
    error: withdrawalError
  } = useAdminPendingPersonalSavingsWithdrawals(
    page + 1,
    pageSize,
    'PENDING' // Always show PENDING withdrawals in the approval queue
  );
  
  // Process request mutation
  const processRequestMutation = useAdminProcessPersonalSavingsRequest();
  
  // Form for approval/rejection notes
  const { control, handleSubmit, reset } = useForm<{ notes: string }>({
    defaultValues: {
      notes: ''
    }
  });
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };
  
  const handleOpenDialog = (requestId: string, action: 'approve' | 'reject' | 'review') => {
    setSelectedRequestId(requestId);
    setApprovalAction(action);
    setIsDialogOpen(true);
    reset();
  };
  
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRequestId(null);
  };
  
  const handleProcessRequest = (data: { notes: string }) => {
    if (!selectedRequestId) return;
    
    processRequestMutation.mutate(
      {
        requestId: selectedRequestId,
        action: approvalAction,
        notes: data.notes
      },
      {
        onSuccess: () => {
          handleCloseDialog();
        }
      }
    );
  };
  
  // Enhanced creation columns with better context
  const creationColumns: Array<any> = [
    {
      id: 'createdAt',
      label: 'Date',
      accessor: (row: any) => row.createdAt,
      format: (value: string) => formatDate(new Date(value)),
    },
    {
      id: 'memberName',
      label: 'Member',
      // Change accessor to return the full name
      accessor: (row: any) => {
        const biodata = row.biodata || {};
        return biodata.fullName || 'N/A';
      },
      Cell: ({ value, row }: { value: string, row: any }) => {
        // Add fallback for undefined biodata object
        const biodata = row.biodata || {};
        
        return (
          <Box>
          {/* Display fullName as primary text */}
          <Typography variant="body2" fontWeight="medium">
          {value}
          </Typography>
          
          {/* Add null check before accessing properties */}
          {biodata && biodata.erpId && (
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            {biodata.erpId}
            </Typography>
          )}
          
          {/* Add null check before accessing properties */}
          {biodata && biodata.department && (
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            {biodata.department}
            </Typography>
          )}
          </Box>
        );
      }
    },
    {
      id: 'details',
      label: 'Details',
      accessor: (row: any) => {
        const data = row.content || row.data || {};
        return data.planName || 'New Personal Savings Plan';
      },
      Cell: ({ value, row }: { value: string, row: any }) => {
        const data = row.content || row.data || {};
        const approvalLevel = row.nextApprovalLevel || 1;
        const totalLevels = row.approvalSteps?.length || 2;
        
        return (
          <Box>
          <Typography variant="body2">{value}</Typography>
          {data.targetAmount && (
            <Typography variant="caption" color="text.secondary">
            Target: {formatCurrency(data.targetAmount)}
            </Typography>
          )}
          {row.requestType && (
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            Type: {row.requestType.replace('PERSONAL_SAVINGS_', '').replace('_', ' ')}
            </Typography>
          )}
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
          Approval: Level {approvalLevel} of {totalLevels}
          </Typography>
          </Box>
        );
      }
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row: any) => row.status,
      Cell: ({ value }: { value: RequestStatus }) => {
        let color: 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error' = 'default';
        let label: string = value as string;
        
        switch(value) {
          case RequestStatus.PENDING:
          color = 'warning';
          label = 'Pending';
          break;
          case RequestStatus.REVIEWED:
          color = 'primary';
          label = 'Reviewed';
          break;
          case RequestStatus.APPROVED:
          color = 'success';
          label = 'Approved';
          break;
          case RequestStatus.REJECTED:
          color = 'error';
          label = 'Rejected';
          break;
          case RequestStatus.CANCELLED:
          color = 'default';
          label = 'Cancelled';
          break;
          case RequestStatus.COMPLETED:
          color = 'success';
          label = RequestStatus.COMPLETED;
          break;
        }
        
        return <Chip label={label} color={color} size="small" />;
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: (row: any) => row.id,
      align: 'right' as const,
      Cell: ({ value, row }: { value: string, row: any }) => {
        const status = row.status as RequestStatus;
        
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
          {/* View details button */}
          <Tooltip title="View request details">
          <Button
          variant="outlined"
          size="small"
          color="primary"
          endIcon={<ArrowForwardIcon />}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/approvals/personal-savings/${value}`);
          }}
          >
          View
          </Button>
          </Tooltip>
          
          {/* Action buttons based on status */}
          {status === RequestStatus.PENDING && (
            <Button
            variant="outlined"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog(value, 'review');
            }}
            >
            Review
            </Button>
          )}
          
          {status === RequestStatus.IN_REVIEW && (
            <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog(value, 'approve');
            }}
            >
            Approve
            </Button>
          )}
          
          {(status === RequestStatus.PENDING || status === RequestStatus.IN_REVIEW) && (
            <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog(value, 'reject');
            }}
            >
            Reject
            </Button>
          )}
          </Stack>
        );
      }
    }
  ];
  
  // Enhanced withdrawal columns with better context
  const withdrawalColumns: Array<any> = [
    {
      id: 'createdAt',
      label: 'Date',
      accessor: (row: any) => row.createdAt,
      format: (value: string) => formatDate(new Date(value)),
    },
    {
      id: 'memberName',
      label: 'Member',
      accessor: (row: any) => row.biodata?.fullName || row.member?.name || 'N/A',
      Cell: ({ value, row }: { value: string, row: any }) => {
        const memberName = row.original?.biodata?.fullName || 'N/A';
        const erpId = row.original?.biodata?.erpId || '';
        
        return (
          <Box>
          <Typography variant="body2" fontWeight="medium">
          {memberName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
          {erpId}
          </Typography>
          </Box>
        );
      },
      filterable: true,
    },
    {
      id: 'details',
      label: 'Details',
      accessor: (row: any) => {
        const data = row.content || row.data || {};
        return `Withdrawal Request: ${formatCurrency(data.amount || 0)}`;
      },
      Cell: ({ value, row }: { value: string, row: any }) => {
        const data = row.content || row.data || {};
        const planName = data.planName || "Personal Savings Plan";
        const approvalLevel = row.nextApprovalLevel || 1;
        const totalLevels = row.approvalSteps?.length || 3;
        
        return (
          <Box>
          <Typography variant="body2">{value}</Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
          Plan: {planName}
          </Typography>
          {data.reason && (
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
            Reason: {data.reason}
            </Typography>
          )}
          <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
          Approval: Level {approvalLevel} of {totalLevels}
          </Typography>
          </Box>
        );
      }
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (row: any) => row.status,
      Cell: ({ value }: { value: RequestStatus }) => {
        let color: 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error' = 'default';
        let label: string = value;
        
        switch(value) {
          case RequestStatus.PENDING:
          color = 'warning';
          label = 'Pending';
          break;
          //   case RequestStatus.IN_REVIEW:
          //   color = 'info';
          //   label = 'In Review';
          // break;
          case RequestStatus.REVIEWED:
          color = 'primary';
          label = 'Reviewed';
          break;
          case RequestStatus.APPROVED:
          color = 'success';
          label = 'Approved';
          break;
          case RequestStatus.REJECTED:
          color = 'error';
          label = 'Rejected';
          break;
          case RequestStatus.CANCELLED:
          color = 'default';
          label = 'Cancelled';
          break;
          case RequestStatus.COMPLETED:
          color = 'success';
          label = 'Completed';
          break;
        }
        
        return <Chip label={label} color={color as any} size="small" />;
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      accessor: (row: any) => row.id,
      align: 'right' as const,
      Cell: ({ value, row }: { value: string, row: any }) => {
        const status = row.status as RequestStatus;
        
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
          {/* View details button */}
          <Tooltip title="View request details">
          <Button
          variant="outlined"
          size="small"
          color="primary"
          endIcon={<ArrowForwardIcon />}
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/admin/approvals/personal-savings/${value}`);
          }}
          >
          View
          </Button>
          </Tooltip>
          
          {/* Status-based action buttons */}
          {status === RequestStatus.PENDING && (
            <Button
            variant="outlined"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog(value, 'review');
            }}
            >
            Review
            </Button>
          )}
          
          {status === RequestStatus.REVIEWED && (
            <Button
            variant="outlined"
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog(value, 'approve');
            }}
            >
            Approve
            </Button>
          )}
          
          {(status === RequestStatus.PENDING || status === RequestStatus.REVIEWED) && (
            <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog(value, 'reject');
            }}
            >
            Reject
            </Button>
          )}
          </Stack>
        );
      }
    }
  ];
  
  // Determine which data to show based on current tab
  const showingWithdrawals = tabValue === 3;
  // Access data correctly from both response structures
  const withdrawalData = withdrawalRequests?.data || [];
  const creationData = creationRequests?.data || [];
  const currentData = showingWithdrawals ? withdrawalData : creationData;
  console.log('Current Data:', currentData, 'Withdrawal Requests:', withdrawalRequests);
  const currentColumns = showingWithdrawals ? 
  withdrawalColumns : 
  creationColumns;
  const isLoading = showingWithdrawals ? 
  isWithdrawalLoading : 
  isCreationLoading;
  const error = showingWithdrawals ? withdrawalError : creationError;
  const currentPagination = {
    pageIndex: page,
    pageSize: pageSize,
    pageCount: (showingWithdrawals
      ? (withdrawalRequests?.meta?.totalPages || 0)
      : (creationRequests?.meta?.totalPages || 0)),
      totalRecords: (showingWithdrawals
        ? (withdrawalRequests?.meta?.total || 0)
        : (creationRequests?.meta?.total || 0)),
      };
      
      return (
        <Box>
        <Typography variant="h4" component="h1" gutterBottom>
        Personal Savings Approvals
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
          Error loading requests: {error.message}
          </Alert>
        )}
        
        <Paper sx={{ mb: 3 }}>
        <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
        <Tab label="Pending" />
        <Tab label="In Review" />
        <Tab label="Reviewed" />
        <Tab label="Withdrawals" />
        </Tabs>
        
        <Box p={3}>
        <DataTable
        columns={currentColumns}
        data={Array.isArray(currentData) ? currentData : []}
        loading={isLoading}
        pagination={currentPagination}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        headerBackgroundColor={theme => theme.palette.mode === 'dark' ? '#333' : '#f5f5f5'}
        noDataMessage={`No ${showingWithdrawals ? 'withdrawal' : 'creation'} requests found`}
        onRowClick={(row: any) => {
          router.push(`/admin/approvals/personal-savings/${row.id}`);
        }}
        />
        </Box>
        </Paper>
        
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
              'Move to Review'}
              </Button>
              </DialogActions>
              </Dialog>
              </Box>
            );
          };
          
          export default PersonalSavingsApprovalsPage;
          