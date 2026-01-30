"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DataTable, DataTableColumn } from '@/components/organisms/DataTable';
import { Button } from '@/components/atoms/Button';
import PermissionGate from '@/components/atoms/PermissionGate';
import { Modal } from '@/components/molecules/Modal';
import { apiService } from '@/lib/api/apiService';
import { savingsService } from '@/lib/api/services/savingsService';
import { memberService } from '@/lib/api/services/memberService';
import { Module } from '@/types/permissions.types';
import { formatCurrency } from '@/utils/formatting/format';
import { useToast } from '@/components/molecules/Toast';

// Create a hook for shares configuration
function useSharesConfig() {
  return useQuery<{ shareValue: number }>({
    queryKey: ['shares-config'],
    queryFn: async () => {
      try {
        const response = await apiService.get<any>('/settings/shares');
        // Unwrap if response is wrapped in API structure
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return response;
      } catch (error) {
        console.error('Failed to fetch share amount:', error);
        return { shareValue: 5000 }; // Default value
      }
    },
  });
}

// Create a hook for members' shares
function useShares(page = 1, limit = 10, search = '') {
  return useQuery({
    queryKey: ['admin-shares', page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        type: 'SHARE',
      });

      if (search) params.append('search', search);

      const response = await apiService.get<any>(`/savings?${params.toString()}`);
      // Unwrap if response is wrapped in API structure
      if (response && typeof response === 'object' && 'data' in response && 'meta' in response.data) {
        return response.data;
      }
      return response;
    },
  });
}

// Create a hook for shares summary
function useSharesSummary() {
  return useQuery({
    queryKey: ['shares-summary'],
    queryFn: async () => {
      try {
        const response = await apiService.get<any>('/savings/summary?type=SHARE');
        // Unwrap if response is wrapped in API structure
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return response;
      } catch (error) {
        console.error('Failed to fetch shares summary:', error);
        throw error;
      }
    },
  });
}

export default function AdminSharesPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [newShareAmount, setNewShareAmount] = useState<string>('');
  const [shareQuantity, setShareQuantity] = useState<string>('1');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  
  // Fetch shares data and configuration
  const { data: sharesData, isLoading, error } = useShares(currentPage, pageSize, searchTerm);
  const { data: sharesConfig, isLoading: isConfigLoading } = useSharesConfig();
  const { data: sharesSummary, isLoading: isSummaryLoading } = useSharesSummary();

  // Set initial share amount from config
  React.useEffect(() => {
    if (sharesConfig?.shareValue) {
      setNewShareAmount(sharesConfig.shareValue.toString());
    }
  }, [sharesConfig]);

  // Mutation for updating share price
  const updateSharePrice = useMutation({
    mutationFn: async (newPrice: number) => {
      return await apiService.put('/settings/shares', { shareValue: newPrice });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares-config'] });
      toast.success('Share price updated successfully');
      setIsConfigModalOpen(false);
    },
    onError: (error) => {
      console.error('Failed to update share price:', error);
      toast.error('Failed to update share price');
    },
  });

  // Mutation for issuing shares
  const issueShares = useMutation({
    mutationFn: async (data: { biodataId: string, quantity: number }) => {
      return await apiService.post('/savings', {
        biodataId: data.biodataId,
        type: 'SHARE',
        amount: data.quantity * (sharesConfig?.shareValue || 5000),
        quantity: data.quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shares'] });
      queryClient.invalidateQueries({ queryKey: ['shares-summary'] });
      toast.success('Shares issued successfully');
      setIsIssueModalOpen(false);
      setSelectedMember(null);
      setShareQuantity('1');
    },
    onError: (error) => {
      console.error('Failed to issue shares:', error);
      toast.error('Failed to issue shares');
    },
  });

  // Search for members
  const searchMembers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await memberService.getAllBiodata({ searchTerm: query, limit: 10 });
      setSearchResults(results.data || []);
    } catch (error) {
      console.error('Failed to search members:', error);
      toast.error('Failed to search members');
    }
  };

  // Handle search input debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      searchMembers(memberSearch);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [memberSearch]);

  // Format shares columns
  const sharesColumns: DataTableColumn<any>[] = [
    {
      id: 'memberName',
      label: 'Member',
      accessor: 'memberName',
      filterable: true,
    },
    {
      id: 'memberNumber',
      label: 'ERP ID',
      accessor: 'memberNumber',
      filterable: true,
    },
    {
      id: 'quantity',
      label: 'Quantity',
      accessor: 'quantity',
      Cell: ({ value }: { value: any }) => value || 1,
      filterable: false,
    },
    {
      id: 'shareValue',
      label: 'Value per Share',
      accessor: 'shareValue',
      Cell: ({ value }: { value: any }) => formatCurrency(value || sharesConfig?.shareValue || 5000),
      filterable: false,
    },
    {
      id: 'amount',
      label: 'Total Value',
      accessor: 'amount',
      Cell: ({ value, row }: { value: any; row: any }) => formatCurrency(value || (row.original.quantity * (sharesConfig?.shareValue || 5000))),
      filterable: false,
    },
    {
      id: 'createdAt',
      label: 'Date',
      accessor: 'createdAt',
      Cell: ({ value }: { value: any }) => new Date(value).toLocaleDateString(),
      filterable: true,
    },
    {
      id: 'id',
      label: 'Actions',
      accessor: 'id',
      Cell: ({ row }: { row: any }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <PermissionGate permissions={['VIEW_SHARES']} module={Module.SHARES}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                // Navigate to member details or shares details
                window.location.href = `/admin/members/${row.original.biodataId}`;
              }}
            >
              View
            </Button>
          </PermissionGate>
        </Box>
      ),
      filterable: false,
    },
  ];

  // Calculate shares statistics
  const sharesStats = {
    totalShares: sharesSummary?.totalQuantity || 0,
    totalMembers: sharesSummary?.distinctMemberCount || 0,
    totalValue: sharesSummary?.totalAmount || 0,
    shareValue: sharesConfig?.shareValue || 5000,
  };

  return (
    <Box sx={{ maxWidth: '100%', pt: 2, pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          Shares Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search shares..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 250 }}
          />
          
          <PermissionGate permissions={['MANAGE_SHARES']} module={Module.SHARES} approvalLevel={2}>
            <Button 
              onClick={() => setIsConfigModalOpen(true)}
              variant="outlined"
            >
              Share Settings
            </Button>
          </PermissionGate>
          
          <PermissionGate permissions={['ISSUE_SHARES']} module={Module.SHARES} approvalLevel={2}>
            <Button 
              onClick={() => setIsIssueModalOpen(true)}
            >
              Issue Shares
            </Button>
          </PermissionGate>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Shares
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isSummaryLoading ? <CircularProgress size={20} /> : sharesStats.totalShares}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Share Value
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isConfigLoading ? <CircularProgress size={20} /> : formatCurrency(sharesStats.shareValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isSummaryLoading ? <CircularProgress size={20} /> : formatCurrency(sharesStats.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Shareholders
              </Typography>
              <Typography variant="h5" component="div" fontWeight={600}>
                {isSummaryLoading ? <CircularProgress size={20} /> : sharesStats.totalMembers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Shares Table */}
      <Paper sx={{ p: 2 }}>
        <DataTable
          columns={sharesColumns}
          data={sharesData?.data || []}
          pagination={{
            pageIndex: currentPage - 1,
            pageSize: pageSize,
            pageCount: sharesData?.meta?.totalPages || 1,
            totalRecords: sharesData?.meta?.total || 0,
          }}
          onPageChange={(newPage) => setCurrentPage(newPage + 1)}
          onPageSizeChange={setPageSize}
          loading={isLoading}
          enableFiltering
          error={error ? 'Failed to load shares data' : undefined}
          noDataMessage="No shares found"
        />
      </Paper>

      {/* Share Configuration Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        title="Share Price Configuration"
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" gutterBottom>
            Set the price for a single share in the cooperative.
          </Typography>
          
          <TextField
            label="Share Price"
            type="number"
            fullWidth
            margin="normal"
            value={newShareAmount}
            onChange={(e) => setNewShareAmount(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  ₦
                </InputAdornment>
              ),
            }}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => setIsConfigModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => updateSharePrice.mutate(Number(newShareAmount))}
              disabled={updateSharePrice.isPending || !newShareAmount || Number(newShareAmount) <= 0}
            >
              {updateSharePrice.isPending ? 'Updating...' : 'Update Share Price'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Issue Shares Modal */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => {
          setIsIssueModalOpen(false);
          setSelectedMember(null);
          setMemberSearch('');
          setSearchResults([]);
        }}
        title="Issue Shares"
        maxWidth="md"
      >
        <Box sx={{ p: 2 }}>
          {!selectedMember ? (
            <>
              <Typography variant="body1" gutterBottom>
                Search for a member to issue shares to:
              </Typography>
              
              <TextField
                label="Search Member"
                fullWidth
                margin="normal"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                helperText="Search by name, ERP ID, or email"
              />
              
              {searchResults.length > 0 && (
                <Paper sx={{ mt: 2, maxHeight: 250, overflow: 'auto' }}>
                  <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                    {searchResults.map((member) => (
                      <Box 
                        component="li" 
                        key={member.id}
                        sx={{ 
                          p: 2, 
                          borderBottom: '1px solid #eee',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedMember(member)}
                      >
                        <Typography variant="body1">{member.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ERP ID: {member.erpId} | Email: {member.email}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              )}
              
              {memberSearch && searchResults.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No members found. Try a different search term.
                </Alert>
              )}
            </>
          ) : (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6">{selectedMember.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  ERP ID: {selectedMember.erpId} | Email: {selectedMember.email}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                  Current share price: <strong>{formatCurrency(sharesConfig?.shareValue || 5000)}</strong>
                </Typography>
              </Box>
              
              <TextField
                label="Number of Shares"
                type="number"
                fullWidth
                margin="normal"
                value={shareQuantity}
                onChange={(e) => setShareQuantity(e.target.value)}
                InputProps={{
                  inputProps: { min: 1 }
                }}
              />
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="body1">
                  Total Cost: <strong>
                    {formatCurrency(Number(shareQuantity) * (sharesConfig?.shareValue || 5000))}
                  </strong>
                </Typography>
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setSelectedMember(null)}
                >
                  Back to Search
                </Button>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      setIsIssueModalOpen(false);
                      setSelectedMember(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => 
                      issueShares.mutate({ 
                        biodataId: selectedMember.id, 
                        quantity: Number(shareQuantity) 
                      })
                    }
                    disabled={
                      issueShares.isPending || 
                      !shareQuantity || 
                      Number(shareQuantity) <= 0
                    }
                  >
                    {issueShares.isPending ? 'Processing...' : 'Issue Shares'}
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}