'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, TableColumn } from '@/components/molecules/DataTable';
import { Button } from '@/components/atoms/Button';
import { MemberStatusBadge } from '@/components/atoms/MemberStatusBadge';
import { FilterDialog } from '@/components/molecules/FilterDialog';
import ExportDialog from '@/components/molecules/ExportDialog';
import { 
  Box, 
  Typography, 
  Alert, 
  Chip, 
  IconButton, 
  Tooltip, 
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import PermissionGate from '@/components/atoms/PermissionGate';
import { useMembers } from '@/lib/hooks/admin/useMembers';
// import { useDepartments } from '@/lib/hooks/admin/useDepartments'; // Add this once implemented
import { usePermissions } from '@/lib/hooks/auth/usePermissions';
import { useQueryClient } from '@tanstack/react-query';
import type { Member, MembershipStatus } from '@/types/member.types';
import { 
  Add as AddIcon,
  FilterList as FilterListIcon, 
  Visibility as ViewIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

// We'll keep the hardcoded member statuses for now
const MEMBER_STATUSES = ['ACTIVE', 'PENDING', 'INACTIVE', 'SUSPENDED'];
// We'll remove this later when we implement the departments hook
const DEPARTMENTS = ['Engineering', 'Finance', 'Human Resources', 'Marketing', 'Operations', 'Sales'];

export default function MembersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  
  // Update filters state with 'ACTIVE' as the default membershipStatus
  const [filters, setFilters] = useState({
    department: '',
    membershipStatus: 'ACTIVE', // Set default to ACTIVE
    search: '' 
  });
  
  // Filter dialog state
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  // Export dialog state
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Format filter options for the filter dialog - include "ALL" option for membershipStatus
  const filterOptions = {
    department: DEPARTMENTS.map(dept => ({ value: dept, label: dept })),
    membershipStatus: [
      { value: '', label: 'All Statuses' }, // Empty value means no filter
      ...MEMBER_STATUSES.map(status => ({ value: status, label: status }))
    ]
  };

  // Fetch members data using our custom hook with default ACTIVE status
  const { 
    members, 
    pagination, 
    isLoading, 
    error,
    deleteMember
  } = useMembers(page, pageSize, {
    department: filters.department,
    membershipStatus: filters.membershipStatus as unknown as MembershipStatus, 
    searchTerm: filters.search
  });

  // Handle delete confirmation
  const handleDeleteClick = (member: Member) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  // Handle actual delete
  const handleDeleteConfirm = async () => {
    if (memberToDelete) {
      try {
        await deleteMember.mutateAsync(memberToDelete.id);
        setDeleteDialogOpen(false);
        setMemberToDelete(null);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  // Handle dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  // Define columns for the data table
  const columns: TableColumn<Member>[] = [
    {
      header: 'ERP ID',
      field: 'erpId',
      sortable: true,
      width: '120px'
    },
    {
      header: 'Name',
      field: 'firstName',
      render: (member: Member) => `${member.firstName} ${member.lastName}`,
      sortable: true
    },
    {
      header: 'Department',
      field: 'department',
      sortable: true
    },
    {
      header: 'Email',
      field: 'emailAddress',
      sortable: true
    },
    {
      header: 'Status',
      field: 'membershipStatus',
      render: (member: Member) => (
        <MemberStatusBadge 
          status={String(member.membershipStatus)} 
          type="membership" 
        />
      ),
      sortable: true,
      width: '120px',
      align: 'center'
    },
    {
      header: 'Verification',
      field: 'isVerified',
      render: (member: Member) => (
        <MemberStatusBadge 
          // Convert boolean to status string for the badge
          status={member.isVerified ? 'VERIFIED' : 'UNVERIFIED'} 
          type="verification" 
        />
      ),
      sortable: true,
      width: '120px',
      align: 'center'
    },
    {
      header: 'Actions',
      field: 'id',
      width: '180px',
      align: 'center',
      render: (member: Member) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Tooltip title="View details">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => router.push(`/admin/members/${member.id}`)}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {hasPermission('members:edit') && (
            <Tooltip title="Edit member">
              <IconButton 
                size="small" 
                color="secondary"
                onClick={() => router.push(`/admin/members/${member.id}/edit`)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          
          {hasPermission('members:delete') && (
            <Tooltip title="Delete member">
              <IconButton 
                size="small" 
                color="error"
                onClick={() => handleDeleteClick(member)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }
  ];

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<string, any>) => {
    // Include valid filters that exist in your schema
    const validFilters = {
      department: newFilters.department,
      membershipStatus: newFilters.membershipStatus,
      search: newFilters.search
    };
    
    setFilters(prev => ({ ...prev, ...validFilters }));
    setPage(1); // Reset to first page when filters change
  };

  // Handle data refresh
  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
  };

  // Handle export
  const handleExport = async (format: string, options: Record<string, boolean>) => {
    try {
      setIsExporting(true);
      
      // In a real implementation, this would connect to a backend service to generate
      // the export file in the requested format
      console.log(`Exporting data in ${format} format with options:`, options);
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Close dialog and show success message
      setExportDialogOpen(false);
      setIsExporting(false);
      
      // You would implement a proper toast notification here
      console.log('Export completed successfully');
    } catch (error) {
      setIsExporting(false);
      console.error('Export failed:', error);
    }
  };

  // Build filter toolbar content - update to reflect default active status
  const filterToolbarContent = (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {filters.department && (
        <Chip 
          label={`Department: ${filters.department}`} 
          onDelete={() => handleFilterChange({ department: '' })}
          size="small"
          color="primary"
          variant="outlined"
        />
      )}
      
      {/* Show membershipStatus chip and allow changing from default ACTIVE */}
      <Chip 
        label={`Status: ${filters.membershipStatus || 'All'}`}
        onDelete={() => handleFilterChange({ membershipStatus: '' })} // Clear to show all
        size="small"
        color="primary"
        variant="outlined"
      />
      
      <Tooltip title="Filter options">
        <IconButton
          size="small"
          onClick={() => setFilterDialogOpen(true)}
        >
          <FilterListIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Refresh data">
        <IconButton 
          size="small"
          onClick={handleRefreshData}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      {hasPermission('members:export') && (
        <Tooltip title="Export data">
          <IconButton 
            size="small"
            onClick={() => setExportDialogOpen(true)}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );

  if (error) {
    return (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load members. Please try again later.
        </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', width: '100%' }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom>
              Members Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage cooperative members and their information
            </Typography>
          </Box>
          
          <PermissionGate permissions={['members:create']}>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => router.push('/admin/members/register')}
            >
              New Member
            </Button>
          </PermissionGate>
        </Box>
        <Box sx={{ p: 3, mb: 3 }}>
          <DataTable
            data={members}
            columns={columns}
            isLoading={isLoading || deleteMember.isLoading}
            pagination={true}
            page={pagination?.page ? pagination.page - 1 : 0}
            pageSize={pagination?.limit || 10}
            onPageChange={(newPage) => setPage(newPage + 1)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            sortable={true}
            onSortChange={(field, direction) => {
              console.log(`Sort by ${field} ${direction}`);
              // In a real implementation, this would update the sorting
            }}
            filterable={true}
            onFilterChange={handleFilterChange}
            toolbarContent={filterToolbarContent}
            emptyMessage="No members found. Try changing your filters or add a new member."
            onRowClick={(member) => router.push(`/admin/members/${member.id}`)}
          />
        </Box>
      </Paper>
      
      <FilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={handleFilterChange}
        filterOptions={filterOptions}
        currentFilters={filters}
      />
      
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onExport={handleExport}
        isLoading={isExporting}
        title="Export Members Data"
        subtitle="Choose format and options for exporting member data"
      />
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {memberToDelete?.firstName} {memberToDelete?.lastName}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={deleteMember.isLoading}
          >
            {deleteMember.isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
